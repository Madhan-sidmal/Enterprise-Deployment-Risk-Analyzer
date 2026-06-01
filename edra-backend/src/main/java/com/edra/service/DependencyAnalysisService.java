package com.edra.service;

import com.edra.model.*;
import com.edra.payload.request.DependencyAnalysisRequest;
import com.edra.payload.request.DependencyAnalysisRequest.DependencyEdge;
import com.edra.payload.request.DependencyAnalysisRequest.ServiceNode;
import com.edra.payload.response.DependencyAnalysisResponse;
import com.edra.payload.response.DependencyAnalysisResponse.*;
import com.edra.repository.DependencyAnalysisRepository;
import com.edra.repository.DeploymentRepository;
import com.edra.repository.UserRepository;
import com.edra.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DependencyAnalysisService {

    private final DependencyAnalysisRepository depAnalysisRepository;
    private final DeploymentRepository deploymentRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        UserDetailsImpl u = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(u.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public DependencyAnalysisResponse analyze(DependencyAnalysisRequest request) {
        Deployment dep = deploymentRepository.findById(request.getDeploymentId())
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        List<ServiceNode>    services     = request.getServices()     != null ? request.getServices()     : new ArrayList<>();
        List<DependencyEdge> edges        = request.getDependencies() != null ? request.getDependencies() : new ArrayList<>();
        Map<String, String>  versionMap   = services.stream()
                .collect(Collectors.toMap(ServiceNode::getName, ServiceNode::getVersion, (a, b) -> a));

        List<DependencyIssue> issues = new ArrayList<>();

        // ── 1. Missing dependencies ───────────────────────
        Set<String> serviceNames = versionMap.keySet();
        for (DependencyEdge edge : edges) {
            if (!serviceNames.contains(edge.getTo())) {
                DependencyIssue issue = new DependencyIssue();
                issue.setSourceService(edge.getFrom());
                issue.setTargetService(edge.getTo());
                issue.setRequiredVersion(edge.getRequiredVersion());
                issue.setAvailableVersion(null);
                issue.setIssueType(DependencyIssueType.MISSING_DEPENDENCY);
                issue.setSeverity(IssueSeverity.HIGH);
                issue.setDescription(edge.getFrom() + " requires " + edge.getTo() + " which is not registered in the service catalog.");
                issue.setResolution("Register service '" + edge.getTo() + "' in the deployment or remove the dependency.");
                issues.add(issue);
            }
        }

        // ── 2. Version mismatches ─────────────────────────
        for (DependencyEdge edge : edges) {
            if (edge.getRequiredVersion() != null && versionMap.containsKey(edge.getTo())) {
                String available = versionMap.get(edge.getTo());
                if (!isVersionCompatible(edge.getRequiredVersion(), available)) {
                    DependencyIssue issue = new DependencyIssue();
                    issue.setSourceService(edge.getFrom());
                    issue.setTargetService(edge.getTo());
                    issue.setRequiredVersion(edge.getRequiredVersion());
                    issue.setAvailableVersion(available);
                    issue.setIssueType(DependencyIssueType.VERSION_MISMATCH);
                    issue.setSeverity(IssueSeverity.MEDIUM);
                    issue.setDescription(edge.getFrom() + " requires " + edge.getTo() + " @ " + edge.getRequiredVersion() + " but found " + available + ".");
                    issue.setResolution("Upgrade or downgrade " + edge.getTo() + " to satisfy version constraint '" + edge.getRequiredVersion() + "'.");
                    issues.add(issue);
                }
            }
        }

        // ── 3. Circular dependencies (DFS) ───────────────
        Map<String, List<String>> graph = new HashMap<>();
        for (DependencyEdge edge : edges) {
            graph.computeIfAbsent(edge.getFrom(), k -> new ArrayList<>()).add(edge.getTo());
        }
        Set<String> visited = new HashSet<>();
        Set<String> stack   = new HashSet<>();
        for (String node : graph.keySet()) {
            List<String> cycle = new ArrayList<>();
            if (detectCycle(node, graph, visited, stack, cycle)) {
                DependencyIssue issue = new DependencyIssue();
                issue.setSourceService(cycle.isEmpty() ? node : cycle.get(0));
                issue.setTargetService(cycle.size() > 1 ? cycle.get(cycle.size() - 1) : node);
                issue.setIssueType(DependencyIssueType.CIRCULAR_DEPENDENCY);
                issue.setSeverity(IssueSeverity.CRITICAL);
                issue.setDescription("Circular dependency detected: " + String.join(" → ", cycle) + " → " + cycle.get(0));
                issue.setResolution("Break the cycle by introducing an abstraction layer or event-driven communication.");
                issues.add(issue);
                break; // report first cycle found
            }
        }

        // ── Persist analysis ──────────────────────────────
        DependencyAnalysis da = new DependencyAnalysis();
        da.setDeployment(dep);
        da.setTotalDependencies(edges.size());
        da.setIssueCount(issues.size());
        da.setIsHealthy(issues.isEmpty());
        da.setAnalyzedBy(getCurrentUser());
        issues.forEach(i -> i.setDependencyAnalysis(da));
        da.setIssues(issues);

        DependencyAnalysis saved = depAnalysisRepository.save(da);
        log.info("Dependency analysis complete for {} — {} issues found", dep.getDeploymentId(), issues.size());

        // ── Build response with graph data ────────────────
        DependencyAnalysisResponse response = DependencyAnalysisResponse.from(saved);
        response.setNodes(buildNodes(services, issues));
        response.setEdges(buildEdges(edges, issues));
        return response;
    }

    public DependencyAnalysisResponse getLatestForDeployment(Long deploymentId) {
        DependencyAnalysis da = depAnalysisRepository
                .findTopByDeploymentIdOrderByAnalyzedAtDesc(deploymentId)
                .orElseThrow(() -> new RuntimeException("No dependency analysis found for deployment: " + deploymentId));
        DependencyAnalysisResponse response = DependencyAnalysisResponse.from(da);
        response.setNodes(buildNodes(null, da.getIssues()));
        response.setEdges(new ArrayList<>());
        return response;
    }

    public List<DependencyAnalysisResponse> getAll() {
        return depAnalysisRepository.findAllByOrderByAnalyzedAtDesc()
                .stream()
                .map(da -> {
                    DependencyAnalysisResponse r = DependencyAnalysisResponse.from(da);
                    r.setNodes(new ArrayList<>());
                    r.setEdges(new ArrayList<>());
                    return r;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStats() {
        long total     = depAnalysisRepository.count();
        long unhealthy = depAnalysisRepository.countByIsHealthyFalse();
        return Map.of(
                "totalAnalyzed", total,
                "healthyCount",  total - unhealthy,
                "unhealthyCount", unhealthy
        );
    }

    // ── Helpers ───────────────────────────────────────────

    private boolean isVersionCompatible(String required, String available) {
        if (required == null || available == null) return true;
        if (required.startsWith("^")) {
            // Major version must match
            String req = required.substring(1);
            return getMajor(req) == getMajor(available);
        }
        if (required.endsWith(".x") || required.endsWith(".*")) {
            String prefix = required.replaceAll("[.*x]+$", "");
            return available.startsWith(prefix);
        }
        return required.equals(available);
    }

    private int getMajor(String version) {
        try { return Integer.parseInt(version.split("\\.")[0]); }
        catch (Exception e) { return -1; }
    }

    private boolean detectCycle(String node, Map<String, List<String>> graph,
                                 Set<String> visited, Set<String> stack, List<String> cycle) {
        if (stack.contains(node)) { cycle.add(node); return true; }
        if (visited.contains(node)) return false;
        visited.add(node);
        stack.add(node);
        for (String neighbor : graph.getOrDefault(node, Collections.emptyList())) {
            if (detectCycle(neighbor, graph, visited, stack, cycle)) {
                cycle.add(0, node);
                return true;
            }
        }
        stack.remove(node);
        return false;
    }

    private List<NodeDTO> buildNodes(List<ServiceNode> services, List<DependencyIssue> issues) {
        Set<String> issueServices = new HashSet<>();
        Map<String, String> issueTypeMap = new HashMap<>();
        if (issues != null) {
            for (DependencyIssue i : issues) {
                issueServices.add(i.getSourceService());
                if (i.getTargetService() != null) issueServices.add(i.getTargetService());
                issueTypeMap.put(i.getSourceService(), i.getIssueType().name());
            }
        }
        if (services == null || services.isEmpty()) {
            return issueServices.stream().map(s -> {
                NodeDTO n = new NodeDTO();
                n.setId(s); n.setLabel(s); n.setVersion("unknown");
                n.setHasIssue(true); n.setIssueType(issueTypeMap.getOrDefault(s, ""));
                return n;
            }).collect(Collectors.toList());
        }
        return services.stream().map(s -> {
            NodeDTO n = new NodeDTO();
            n.setId(s.getName()); n.setLabel(s.getName()); n.setVersion(s.getVersion());
            n.setHasIssue(issueServices.contains(s.getName()));
            n.setIssueType(issueTypeMap.getOrDefault(s.getName(), ""));
            return n;
        }).collect(Collectors.toList());
    }

    private List<EdgeDTO> buildEdges(List<DependencyEdge> edges, List<DependencyIssue> issues) {
        Set<String> conflictPairs = new HashSet<>();
        Map<String, String> conflictTypeMap = new HashMap<>();
        if (issues != null) {
            for (DependencyIssue i : issues) {
                String key = i.getSourceService() + "->" + i.getTargetService();
                conflictPairs.add(key);
                conflictTypeMap.put(key, i.getIssueType().name());
            }
        }
        if (edges == null) return new ArrayList<>();
        return edges.stream().map(e -> {
            EdgeDTO dto = new EdgeDTO();
            dto.setFrom(e.getFrom()); dto.setTo(e.getTo());
            dto.setRequiredVersion(e.getRequiredVersion());
            String key = e.getFrom() + "->" + e.getTo();
            dto.setHasConflict(conflictPairs.contains(key));
            dto.setConflictType(conflictTypeMap.getOrDefault(key, ""));
            return dto;
        }).collect(Collectors.toList());
    }
}
