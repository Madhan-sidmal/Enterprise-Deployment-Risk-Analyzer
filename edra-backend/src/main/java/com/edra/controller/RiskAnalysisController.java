package com.edra.controller;

import com.edra.payload.response.RiskScoreResponse;
import com.edra.service.RiskScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class RiskAnalysisController {

    private final RiskScoreService riskScoreService;

    // ── Analyze a deployment (creates/updates risk score) ──
    @PostMapping("/analyze/{deploymentId}")
    public ResponseEntity<RiskScoreResponse> analyzeDeployment(
            @PathVariable Long deploymentId) {
        return ResponseEntity.ok(riskScoreService.analyzeDeployment(deploymentId));
    }

    // ── Get existing risk score for a deployment ──────────
    @GetMapping("/deployment/{deploymentId}")
    public ResponseEntity<RiskScoreResponse> getRiskScore(
            @PathVariable Long deploymentId) {
        return ResponseEntity.ok(riskScoreService.getRiskScore(deploymentId));
    }

    // ── Get all risk scores ───────────────────────────────
    @GetMapping
    public ResponseEntity<List<RiskScoreResponse>> getAllRiskScores() {
        return ResponseEntity.ok(riskScoreService.getAllRiskScores());
    }

    // ── Risk distribution stats ───────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getRiskStats() {
        return ResponseEntity.ok(riskScoreService.getRiskStats());
    }
}
