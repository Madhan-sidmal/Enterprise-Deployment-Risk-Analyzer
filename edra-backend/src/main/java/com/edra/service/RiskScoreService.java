package com.edra.service;

import com.edra.model.*;
import com.edra.payload.response.RiskScoreResponse;
import com.edra.payload.response.RiskScoreResponse.RiskFactor;
import com.edra.repository.DeploymentRepository;
import com.edra.repository.RiskScoreRepository;
import com.edra.repository.UserRepository;
import com.edra.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskScoreService {

    // ── Score Constants ────────────────────────────────────
    private static final int SCORE_MODIFIED_FILES    = 20;   // > 20 files
    private static final int SCORE_PRODUCTION        = 25;   // production environment
    private static final int SCORE_CRITICAL_CONFIG   = 30;   // critical config change
    private static final int SCORE_DEPENDENCY        = 15;   // dependency conflict
    private static final int SCORE_FAILURE_HISTORY   = 10;   // previous failures
    private static final int MAX_SCORE               = 100;

    private final DeploymentRepository deploymentRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        UserDetailsImpl u = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(u.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ══════════════════════════════════════════════════════
    //  CORE SCORING ENGINE
    // ══════════════════════════════════════════════════════
    @Transactional
    public RiskScoreResponse analyzeDeployment(Long deploymentId) {
        Deployment dep = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new RuntimeException("Deployment not found: " + deploymentId));

        User analyst = getCurrentUser();

        // ── Calculate factor scores ──────────────────────
        int scoreFiles    = (dep.getModifiedFilesCount() != null && dep.getModifiedFilesCount() > 20) ? SCORE_MODIFIED_FILES : 0;
        int scoreProd     = dep.getEnvironment() == Environment.PRODUCTION ? SCORE_PRODUCTION : 0;
        int scoreCfg      = Boolean.TRUE.equals(dep.getHasCriticalConfigChange()) ? SCORE_CRITICAL_CONFIG : 0;
        int scoreDep      = Boolean.TRUE.equals(dep.getHasDependencyConflict())   ? SCORE_DEPENDENCY : 0;
        int scoreFailure  = (dep.getPreviousFailureCount() != null && dep.getPreviousFailureCount() > 0) ? SCORE_FAILURE_HISTORY : 0;

        int totalScore = Math.min(scoreFiles + scoreProd + scoreCfg + scoreDep + scoreFailure, MAX_SCORE);

        RiskLevel level = totalScore <= 30 ? RiskLevel.LOW
                        : totalScore <= 60 ? RiskLevel.MEDIUM
                        : RiskLevel.HIGH;

        // ── Simple ML-like failure probability ──────────
        double probability = Math.min((totalScore / 100.0) * 1.2, 1.0);

        // ── Generate recommendation ───────────────────────
        String recommendation = buildRecommendation(level, scoreProd > 0, scoreCfg > 0, scoreDep > 0);

        // ── Persist or update ────────────────────────────
        RiskScore rs = riskScoreRepository.findByDeployment(dep).orElse(new RiskScore());
        rs.setDeployment(dep);
        rs.setScore(totalScore);
        rs.setRiskLevel(level);
        rs.setScoreModifiedFiles(scoreFiles);
        rs.setScoreProduction(scoreProd);
        rs.setScoreCriticalConfig(scoreCfg);
        rs.setScoreDependencyConflict(scoreDep);
        rs.setScoreFailureHistory(scoreFailure);
        rs.setFailureProbability(Math.round(probability * 1000) / 10.0);
        rs.setRecommendation(recommendation);
        rs.setAnalyzedBy(analyst);

        RiskScore saved = riskScoreRepository.save(rs);
        log.info("Risk analysis complete for {} — Score: {}, Level: {}", dep.getDeploymentId(), totalScore, level);

        // ── Build response with factor details ────────────
        RiskScoreResponse response = RiskScoreResponse.from(saved);
        response.setFactors(buildFactors(dep, scoreFiles, scoreProd, scoreCfg, scoreDep, scoreFailure));
        return response;
    }

    public RiskScoreResponse getRiskScore(Long deploymentId) {
        RiskScore rs = riskScoreRepository.findByDeploymentId(deploymentId)
                .orElseThrow(() -> new RuntimeException("Risk analysis not found for deployment: " + deploymentId));
        RiskScoreResponse response = RiskScoreResponse.from(rs);
        response.setFactors(buildFactors(
                rs.getDeployment(),
                rs.getScoreModifiedFiles(), rs.getScoreProduction(),
                rs.getScoreCriticalConfig(), rs.getScoreDependencyConflict(),
                rs.getScoreFailureHistory()
        ));
        return response;
    }

    public List<RiskScoreResponse> getAllRiskScores() {
        return riskScoreRepository.findAllByOrderByAnalyzedAtDesc()
                .stream()
                .map(rs -> {
                    RiskScoreResponse r = RiskScoreResponse.from(rs);
                    r.setFactors(buildFactors(rs.getDeployment(),
                            rs.getScoreModifiedFiles(), rs.getScoreProduction(),
                            rs.getScoreCriticalConfig(), rs.getScoreDependencyConflict(),
                            rs.getScoreFailureHistory()));
                    return r;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getRiskStats() {
        long lowCount    = riskScoreRepository.countByRiskLevel(RiskLevel.LOW);
        long mediumCount = riskScoreRepository.countByRiskLevel(RiskLevel.MEDIUM);
        long highCount   = riskScoreRepository.countByRiskLevel(RiskLevel.HIGH);
        long total       = riskScoreRepository.count();
        Double avgScore  = riskScoreRepository.findAverageScore();
        Double avgProd   = riskScoreRepository.findAverageScoreForProduction();

        return Map.of(
                "totalAnalyzed",    total,
                "lowRisk",          lowCount,
                "mediumRisk",       mediumCount,
                "highRisk",         highCount,
                "averageScore",     avgScore != null ? Math.round(avgScore * 10) / 10.0 : 0.0,
                "avgProductionScore", avgProd != null ? Math.round(avgProd * 10) / 10.0 : 0.0
        );
    }

    // ══════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════

    private List<RiskFactor> buildFactors(Deployment dep,
                                          int scoreFiles, int scoreProd,
                                          int scoreCfg, int scoreDep, int scoreFailure) {
        List<RiskFactor> factors = new ArrayList<>();

        RiskFactor f1 = new RiskFactor();
        f1.setName("Modified Files");
        f1.setDescription(dep.getModifiedFilesCount() + " files changed (threshold: > 20 files)");
        f1.setContribution(scoreFiles);
        f1.setTriggered(scoreFiles > 0);
        f1.setSeverity(scoreFiles > 0 ? "MEDIUM" : "NONE");
        factors.add(f1);

        RiskFactor f2 = new RiskFactor();
        f2.setName("Production Environment");
        f2.setDescription("Deploying directly to " + dep.getEnvironment().name());
        f2.setContribution(scoreProd);
        f2.setTriggered(scoreProd > 0);
        f2.setSeverity(scoreProd > 0 ? "HIGH" : "NONE");
        factors.add(f2);

        RiskFactor f3 = new RiskFactor();
        f3.setName("Critical Config Change");
        f3.setDescription("Changes to DB connections, API keys, or security settings");
        f3.setContribution(scoreCfg);
        f3.setTriggered(scoreCfg > 0);
        f3.setSeverity(scoreCfg > 0 ? "CRITICAL" : "NONE");
        factors.add(f3);

        RiskFactor f4 = new RiskFactor();
        f4.setName("Dependency Conflict");
        f4.setDescription("Version mismatches or circular dependencies detected");
        f4.setContribution(scoreDep);
        f4.setTriggered(scoreDep > 0);
        f4.setSeverity(scoreDep > 0 ? "HIGH" : "NONE");
        factors.add(f4);

        RiskFactor f5 = new RiskFactor();
        f5.setName("Failure History");
        f5.setDescription(dep.getPreviousFailureCount() + " previous deployment failure(s)");
        f5.setContribution(scoreFailure);
        f5.setTriggered(scoreFailure > 0);
        f5.setSeverity(scoreFailure > 0 ? "MEDIUM" : "NONE");
        factors.add(f5);

        return factors;
    }

    private String buildRecommendation(RiskLevel level, boolean isProd, boolean hasCfg, boolean hasDep) {
        StringBuilder sb = new StringBuilder();
        switch (level) {
            case LOW -> sb.append("✅ Low risk deployment. Standard review and testing should be sufficient. ");
            case MEDIUM -> sb.append("⚠️ Medium risk deployment. Recommend additional QA review and staged rollout. ");
            case HIGH -> sb.append("🚨 High risk deployment. Mandatory security review, rollback plan required, and incident response team on standby. ");
        }
        if (isProd) sb.append("Ensure production readiness checklist is complete. ");
        if (hasCfg) sb.append("All critical config changes must be peer-reviewed before deployment. ");
        if (hasDep) sb.append("Resolve all dependency conflicts before proceeding to production. ");
        return sb.toString().trim();
    }
}
