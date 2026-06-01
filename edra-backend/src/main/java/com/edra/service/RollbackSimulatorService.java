package com.edra.service;

import com.edra.model.*;
import com.edra.payload.request.RollbackSimulationRequest;
import com.edra.payload.response.RollbackPlanResponse;
import com.edra.payload.response.RollbackPlanResponse.StepDTO;
import com.edra.repository.DeploymentRepository;
import com.edra.repository.RollbackPlanRepository;
import com.edra.repository.UserRepository;
import com.edra.security.UserDetailsImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class RollbackSimulatorService {

    private final RollbackPlanRepository rollbackRepo;
    private final DeploymentRepository   deploymentRepo;
    private final UserRepository         userRepo;
    private static final ObjectMapper    MAPPER = new ObjectMapper();

    private User getCurrentUser() {
        UserDetailsImpl u = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepo.findById(u.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public RollbackPlanResponse simulate(RollbackSimulationRequest req) {
        Deployment dep = deploymentRepo.findById(req.getDeploymentId())
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        // ── Generate simulation steps ────────────────────
        List<StepDTO> steps = generateSteps(dep, req.getRollbackToVersion());

        // ── Calculate feasibility score ───────────────────
        int feasibility = calculateFeasibility(dep, req.getRollbackToVersion());
        String label    = feasibility >= 70 ? "High" : feasibility >= 40 ? "Medium" : "Low";

        // ── Estimate downtime ─────────────────────────────
        int downtime = estimateDowntime(dep, steps);

        // ── Build notes ───────────────────────────────────
        String notes = buildNotes(dep, feasibility, req.getRollbackToVersion());

        // ── Persist ───────────────────────────────────────
        RollbackPlan plan = new RollbackPlan();
        plan.setDeployment(dep);
        plan.setRollbackToVersion(req.getRollbackToVersion());
        plan.setReason(req.getReason());
        plan.setEstimatedDowntimeMinutes(downtime);
        plan.setStepsCount(steps.size());
        plan.setFeasibilityScore(feasibility);
        plan.setFeasibilityLabel(label);
        plan.setNotes(notes);
        plan.setStatus(RollbackStatus.SIMULATED);
        plan.setCreatedBy(getCurrentUser());

        try {
            plan.setSimulationSteps(MAPPER.writeValueAsString(steps));
        } catch (Exception e) {
            plan.setSimulationSteps("[]");
        }

        RollbackPlan saved = rollbackRepo.save(plan);
        log.info("Rollback simulation for {} → v{} — Feasibility: {}", dep.getDeploymentId(), req.getRollbackToVersion(), feasibility);

        RollbackPlanResponse response = RollbackPlanResponse.from(saved);
        response.setSimulationSteps(steps);
        return response;
    }

    @Transactional
    public RollbackPlanResponse initiateRollback(Long planId) {
        RollbackPlan plan = rollbackRepo.findById(planId)
                .orElseThrow(() -> new RuntimeException("Rollback plan not found"));
        if (plan.getStatus() != RollbackStatus.SIMULATED) {
            throw new RuntimeException("Only SIMULATED plans can be initiated");
        }
        plan.setStatus(RollbackStatus.INITIATED);
        return RollbackPlanResponse.from(rollbackRepo.save(plan));
    }

    public RollbackPlanResponse getById(Long id) {
        return RollbackPlanResponse.from(
                rollbackRepo.findById(id).orElseThrow(() -> new RuntimeException("Rollback plan not found")));
    }

    public List<RollbackPlanResponse> getForDeployment(Long deploymentId) {
        return rollbackRepo.findByDeploymentIdOrderByCreatedAtDesc(deploymentId)
                .stream().map(RollbackPlanResponse::from).collect(Collectors.toList());
    }

    public List<RollbackPlanResponse> getAll() {
        return rollbackRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(RollbackPlanResponse::from).collect(Collectors.toList());
    }

    public Map<String, Long> getStats() {
        return Map.of(
                "total",     rollbackRepo.count(),
                "simulated", rollbackRepo.countByStatus(RollbackStatus.SIMULATED),
                "initiated", rollbackRepo.countByStatus(RollbackStatus.INITIATED),
                "completed", rollbackRepo.countByStatus(RollbackStatus.COMPLETED),
                "failed",    rollbackRepo.countByStatus(RollbackStatus.FAILED)
        );
    }

    // ══════════════════════════════════════════════════════
    //  Simulation Engine
    // ══════════════════════════════════════════════════════

    private List<StepDTO> generateSteps(Deployment dep, String targetVersion) {
        List<StepDTO> steps = new ArrayList<>();
        int n = 1;

        step(steps, n++, "Pre-flight Health Check",
                "Verify current system health, active connections, and database state before rollback.",
                "3 min", "LOW", true);

        step(steps, n++, "Create System Snapshot",
                "Backup current application state, DB schemas, and configuration files to secure storage.",
                "5 min", "LOW", true);

        if (Boolean.TRUE.equals(dep.getHasCriticalConfigChange())) {
            step(steps, n++, "Revert Critical Config",
                    "Roll back database connection strings, API keys, and environment variables to " + targetVersion + " configuration.",
                    "4 min", "HIGH", false);
        }

        step(steps, n++, "Stop Application Instances",
                "Gracefully drain live traffic and shut down all running instances of " + dep.getApplicationName() + " v" + dep.getVersion() + ".",
                "2 min", "MEDIUM", true);

        if (dep.getEnvironment() == Environment.PRODUCTION) {
            step(steps, n++, "Enable Maintenance Mode",
                    "Display maintenance page to users via load balancer. Notify stakeholders of planned downtime.",
                    "1 min", "LOW", true);
        }

        step(steps, n++, "Deploy Previous Version",
                "Pull " + dep.getApplicationName() + " v" + targetVersion + " from artifact registry and deploy to " + dep.getEnvironment() + " environment.",
                "6 min", "MEDIUM", true);

        if (Boolean.TRUE.equals(dep.getHasDependencyConflict())) {
            step(steps, n++, "Resolve Dependency Conflicts",
                    "Reinstall compatible dependency versions matching v" + targetVersion + " requirements.",
                    "4 min", "HIGH", false);
        }

        step(steps, n++, "Database Migration Rollback",
                "Execute reverse migration scripts to restore DB schema to version compatible with v" + targetVersion + ".",
                "8 min", "HIGH", false);

        step(steps, n++, "Run Smoke Tests",
                "Execute critical path tests to verify the rolled-back application is functional.",
                "5 min", "MEDIUM", true);

        step(steps, n++, "Restore Traffic",
                "Re-enable load balancer routing. Disable maintenance mode. Monitor error rates.",
                "2 min", "LOW", true);

        step(steps, n++, "Post-Rollback Monitoring",
                "Monitor application metrics, error rates, and logs for 15 minutes to confirm stability.",
                "15 min", "LOW", true);

        return steps;
    }

    private void step(List<StepDTO> steps, int n, String title, String desc, String time, String risk, boolean automated) {
        StepDTO s = new StepDTO();
        s.setStepNumber(n);
        s.setTitle(title);
        s.setDescription(desc);
        s.setEstimatedTime(time);
        s.setRisk(risk);
        s.setAutomated(automated);
        steps.add(s);
    }

    private int calculateFeasibility(Deployment dep, String targetVersion) {
        int score = 100;
        if (dep.getEnvironment() == Environment.PRODUCTION)        score -= 20;
        if (Boolean.TRUE.equals(dep.getHasCriticalConfigChange())) score -= 15;
        if (Boolean.TRUE.equals(dep.getHasDependencyConflict()))   score -= 15;
        if (dep.getPreviousFailureCount() != null && dep.getPreviousFailureCount() > 2) score -= 10;
        if (dep.getModifiedFilesCount() != null && dep.getModifiedFilesCount() > 50)   score -= 10;
        return Math.max(score, 10);
    }

    private int estimateDowntime(Deployment dep, List<StepDTO> steps) {
        int base = steps.size() * 2; // 2 min per step base
        if (dep.getEnvironment() == Environment.PRODUCTION) base += 10;
        if (Boolean.TRUE.equals(dep.getHasCriticalConfigChange())) base += 5;
        if (Boolean.TRUE.equals(dep.getHasDependencyConflict()))   base += 5;
        return base;
    }

    private String buildNotes(Deployment dep, int feasibility, String targetVersion) {
        StringBuilder sb = new StringBuilder();
        if (feasibility < 40) {
            sb.append("⚠️ LOW FEASIBILITY: This rollback is complex and carries significant risk. Ensure incident response team is on standby. ");
        }
        if (dep.getEnvironment() == Environment.PRODUCTION) {
            sb.append("🚀 PRODUCTION rollback — coordinate with all stakeholders and schedule during off-peak hours. ");
        }
        if (Boolean.TRUE.equals(dep.getHasCriticalConfigChange())) {
            sb.append("🔧 Manual config revert required — cannot be automated. Assign a senior engineer. ");
        }
        sb.append("Target version: v").append(targetVersion).append(". ");
        sb.append("Always test in STAGING before executing in PRODUCTION.");
        return sb.toString();
    }
}
