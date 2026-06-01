package com.edra.payload.response;

import com.edra.model.RiskLevel;
import com.edra.model.RiskScore;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RiskScoreResponse {

    private Long id;
    private Long deploymentId;
    private String deploymentUniqueId;
    private String applicationName;
    private String environment;

    private Integer score;
    private RiskLevel riskLevel;
    private String riskCategory; // "Low Risk", "Medium Risk", "High Risk"
    private String riskColor;    // for frontend

    // Factor breakdown
    private Integer scoreModifiedFiles;
    private Integer scoreProduction;
    private Integer scoreCriticalConfig;
    private Integer scoreDependencyConflict;
    private Integer scoreFailureHistory;

    // Raw inputs
    private Integer modifiedFilesCount;
    private Boolean hasCriticalConfigChange;
    private Boolean hasDependencyConflict;
    private Integer previousFailureCount;
    private Boolean isProduction;

    // Factor explanations
    private List<RiskFactor> factors;

    private Double failureProbability;
    private String recommendation;

    private String analyzedByUsername;
    private LocalDateTime analyzedAt;

    @Data
    public static class RiskFactor {
        private String name;
        private String description;
        private int contribution;
        private boolean triggered;
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    }

    public static RiskScoreResponse from(RiskScore rs) {
        RiskScoreResponse r = new RiskScoreResponse();
        r.setId(rs.getId());
        r.setScore(rs.getScore());
        r.setRiskLevel(rs.getRiskLevel());
        r.setScoreModifiedFiles(rs.getScoreModifiedFiles());
        r.setScoreProduction(rs.getScoreProduction());
        r.setScoreCriticalConfig(rs.getScoreCriticalConfig());
        r.setScoreDependencyConflict(rs.getScoreDependencyConflict());
        r.setScoreFailureHistory(rs.getScoreFailureHistory());
        r.setFailureProbability(rs.getFailureProbability());
        r.setRecommendation(rs.getRecommendation());
        r.setAnalyzedAt(rs.getAnalyzedAt());

        switch (rs.getRiskLevel()) {
            case LOW    -> { r.setRiskCategory("Low Risk");    r.setRiskColor("#10b981"); }
            case MEDIUM -> { r.setRiskCategory("Medium Risk"); r.setRiskColor("#f59e0b"); }
            case HIGH   -> { r.setRiskCategory("High Risk");   r.setRiskColor("#ef4444"); }
        }

        if (rs.getDeployment() != null) {
            r.setDeploymentId(rs.getDeployment().getId());
            r.setDeploymentUniqueId(rs.getDeployment().getDeploymentId());
            r.setApplicationName(rs.getDeployment().getApplicationName());
            r.setEnvironment(rs.getDeployment().getEnvironment().name());
            r.setModifiedFilesCount(rs.getDeployment().getModifiedFilesCount());
            r.setHasCriticalConfigChange(rs.getDeployment().getHasCriticalConfigChange());
            r.setHasDependencyConflict(rs.getDeployment().getHasDependencyConflict());
            r.setPreviousFailureCount(rs.getDeployment().getPreviousFailureCount());
            r.setIsProduction(rs.getDeployment().getEnvironment().name().equals("PRODUCTION"));
        }
        if (rs.getAnalyzedBy() != null) {
            r.setAnalyzedByUsername(rs.getAnalyzedBy().getUsername());
        }
        return r;
    }
}
