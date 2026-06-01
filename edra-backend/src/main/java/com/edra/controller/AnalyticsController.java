package com.edra.controller;

import com.edra.model.DeploymentStatus;
import com.edra.model.Environment;
import com.edra.repository.DeploymentRepository;
import com.edra.repository.RiskScoreRepository;
import com.edra.repository.ApprovalRecordRepository;
import com.edra.model.ApprovalDecision;
import com.edra.repository.RollbackPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    private final DeploymentRepository    deploymentRepo;
    private final RiskScoreRepository     riskRepo;
    private final ApprovalRecordRepository approvalRepo;
    private final RollbackPlanRepository  rollbackRepo;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        Map<String, Object> data = new LinkedHashMap<>();

        // Deployment counts by status
        Map<String, Long> depByStatus = new LinkedHashMap<>();
        for (DeploymentStatus s : DeploymentStatus.values()) {
            depByStatus.put(s.name(), deploymentRepo.countByStatus(s));
        }
        data.put("deploymentsByStatus", depByStatus);

        // Deployment counts by environment
        Map<String, Long> depByEnv = new LinkedHashMap<>();
        for (Environment e : Environment.values()) {
            depByEnv.put(e.name(), deploymentRepo.countByEnvironment(e));
        }
        data.put("deploymentsByEnvironment", depByEnv);

        // Risk distribution
        Map<String, Object> riskDist = new LinkedHashMap<>();
        riskDist.put("low",    riskRepo.countLow());
        riskDist.put("medium", riskRepo.countMedium());
        riskDist.put("high",   riskRepo.countHigh());
        riskDist.put("avgScore", riskRepo.averageScore().orElse(0.0));
        data.put("riskDistribution", riskDist);

        // Approval stats
        Map<String, Object> approvalStats = new LinkedHashMap<>();
        approvalStats.put("approved", approvalRepo.countByDecision(ApprovalDecision.APPROVED));
        approvalStats.put("rejected", approvalRepo.countByDecision(ApprovalDecision.REJECTED));
        data.put("approvalStats", approvalStats);

        // Summary totals
        data.put("totalDeployments",  deploymentRepo.count());
        data.put("totalRiskScores",   riskRepo.count());
        data.put("totalRollbacks",    rollbackRepo.count());
        data.put("productionDeps",    deploymentRepo.countProductionDeployments());

        return ResponseEntity.ok(data);
    }
}
