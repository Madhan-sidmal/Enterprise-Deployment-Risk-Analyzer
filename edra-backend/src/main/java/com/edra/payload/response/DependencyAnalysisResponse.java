package com.edra.payload.response;

import com.edra.model.DependencyAnalysis;
import com.edra.model.DependencyIssue;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class DependencyAnalysisResponse {

    private Long id;
    private Long deploymentId;
    private String deploymentUniqueId;
    private String applicationName;

    private Integer totalDependencies;
    private Integer issueCount;
    private Boolean isHealthy;
    private String healthStatus; // "Healthy" | "Issues Found"

    private List<IssueDTO> issues;
    private List<NodeDTO>  nodes;
    private List<EdgeDTO>  edges;

    private String analyzedByUsername;
    private LocalDateTime analyzedAt;

    @Data
    public static class IssueDTO {
        private Long id;
        private String sourceService;
        private String targetService;
        private String requiredVersion;
        private String availableVersion;
        private String issueType;
        private String severity;
        private String description;
        private String resolution;
    }

    // Graph nodes / edges populated by service
    @Data
    public static class NodeDTO {
        private String id;
        private String label;
        private String version;
        private boolean hasIssue;
        private String issueType;
    }

    @Data
    public static class EdgeDTO {
        private String from;
        private String to;
        private String requiredVersion;
        private boolean hasConflict;
        private String conflictType;
    }

    public static DependencyAnalysisResponse from(DependencyAnalysis da) {
        DependencyAnalysisResponse r = new DependencyAnalysisResponse();
        r.setId(da.getId());
        r.setTotalDependencies(da.getTotalDependencies());
        r.setIssueCount(da.getIssueCount());
        r.setIsHealthy(da.getIsHealthy());
        r.setHealthStatus(da.getIsHealthy() ? "Healthy" : "Issues Found");
        r.setAnalyzedAt(da.getAnalyzedAt());

        if (da.getDeployment() != null) {
            r.setDeploymentId(da.getDeployment().getId());
            r.setDeploymentUniqueId(da.getDeployment().getDeploymentId());
            r.setApplicationName(da.getDeployment().getApplicationName());
        }
        if (da.getAnalyzedBy() != null) {
            r.setAnalyzedByUsername(da.getAnalyzedBy().getUsername());
        }
        if (da.getIssues() != null) {
            r.setIssues(da.getIssues().stream().map(i -> {
                IssueDTO dto = new IssueDTO();
                dto.setId(i.getId());
                dto.setSourceService(i.getSourceService());
                dto.setTargetService(i.getTargetService());
                dto.setRequiredVersion(i.getRequiredVersion());
                dto.setAvailableVersion(i.getAvailableVersion());
                dto.setIssueType(i.getIssueType().name());
                dto.setSeverity(i.getSeverity().name());
                dto.setDescription(i.getDescription());
                dto.setResolution(i.getResolution());
                return dto;
            }).collect(Collectors.toList()));
        }
        return r;
    }
}
