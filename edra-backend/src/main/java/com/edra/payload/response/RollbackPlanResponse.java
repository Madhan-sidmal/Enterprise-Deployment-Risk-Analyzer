package com.edra.payload.response;

import com.edra.model.RollbackPlan;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class RollbackPlanResponse {

    private Long   id;
    private Long   deploymentId;
    private String deploymentUniqueId;
    private String applicationName;
    private String currentVersion;
    private String rollbackToVersion;
    private String reason;

    private Integer estimatedDowntimeMinutes;
    private Integer stepsCount;
    private List<StepDTO> simulationSteps;

    private Integer feasibilityScore;
    private String  feasibilityLabel;
    private String  feasibilityColor;
    private String  notes;
    private String  status;

    private String        createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime executedAt;

    @Data
    public static class StepDTO {
        private int    stepNumber;
        private String title;
        private String description;
        private String estimatedTime;  // e.g. "2 min"
        private String risk;           // LOW | MEDIUM | HIGH
        private boolean automated;
    }

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static RollbackPlanResponse from(RollbackPlan p) {
        RollbackPlanResponse r = new RollbackPlanResponse();
        r.setId(p.getId());
        r.setRollbackToVersion(p.getRollbackToVersion());
        r.setReason(p.getReason());
        r.setEstimatedDowntimeMinutes(p.getEstimatedDowntimeMinutes());
        r.setStepsCount(p.getStepsCount());
        r.setFeasibilityScore(p.getFeasibilityScore());
        r.setFeasibilityLabel(p.getFeasibilityLabel());
        r.setNotes(p.getNotes());
        r.setStatus(p.getStatus().name());
        r.setCreatedAt(p.getCreatedAt());
        r.setExecutedAt(p.getExecutedAt());

        r.setFeasibilityColor(
                p.getFeasibilityScore() >= 70 ? "#10b981"
                : p.getFeasibilityScore() >= 40 ? "#f59e0b"
                : "#ef4444");

        if (p.getDeployment() != null) {
            r.setDeploymentId(p.getDeployment().getId());
            r.setDeploymentUniqueId(p.getDeployment().getDeploymentId());
            r.setApplicationName(p.getDeployment().getApplicationName());
            r.setCurrentVersion(p.getDeployment().getVersion());
        }
        if (p.getCreatedBy() != null) {
            r.setCreatedByUsername(p.getCreatedBy().getUsername());
        }

        // Deserialize steps JSON
        try {
            if (p.getSimulationSteps() != null) {
                r.setSimulationSteps(MAPPER.readValue(p.getSimulationSteps(),
                        new TypeReference<List<StepDTO>>() {}));
            }
        } catch (Exception e) {
            r.setSimulationSteps(new ArrayList<>());
        }
        return r;
    }
}
