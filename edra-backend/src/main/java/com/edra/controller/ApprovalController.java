package com.edra.controller;

import com.edra.payload.request.ApprovalRequest;
import com.edra.payload.response.ApprovalRecordResponse;
import com.edra.payload.response.DeploymentResponse;
import com.edra.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ApprovalController {

    private final ApprovalService approvalService;

    // ── Pending queue (Admin + RM only) ───────────────────
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RELEASE_MANAGER')")
    public ResponseEntity<List<DeploymentResponse>> getPendingQueue() {
        return ResponseEntity.ok(approvalService.getPendingQueue());
    }

    // ── Approve ───────────────────────────────────────────
    @PostMapping("/{deploymentId}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RELEASE_MANAGER')")
    public ResponseEntity<ApprovalRecordResponse> approve(
            @PathVariable Long deploymentId,
            @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(approvalService.approve(deploymentId, req));
    }

    // ── Reject ────────────────────────────────────────────
    @PostMapping("/{deploymentId}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RELEASE_MANAGER')")
    public ResponseEntity<ApprovalRecordResponse> reject(
            @PathVariable Long deploymentId,
            @RequestBody ApprovalRequest req) {
        return ResponseEntity.ok(approvalService.reject(deploymentId, req));
    }

    // ── Mark as Deployed ──────────────────────────────────
    @PatchMapping("/{deploymentId}/deploy")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RELEASE_MANAGER')")
    public ResponseEntity<DeploymentResponse> markDeployed(@PathVariable Long deploymentId) {
        return ResponseEntity.ok(approvalService.markDeployed(deploymentId));
    }

    // ── History (all) ─────────────────────────────────────
    @GetMapping("/history")
    public ResponseEntity<List<ApprovalRecordResponse>> getHistory() {
        return ResponseEntity.ok(approvalService.getApprovalHistory());
    }

    // ── History for a single deployment ──────────────────
    @GetMapping("/deployment/{deploymentId}")
    public ResponseEntity<List<ApprovalRecordResponse>> getHistoryForDeployment(
            @PathVariable Long deploymentId) {
        return ResponseEntity.ok(approvalService.getApprovalHistoryForDeployment(deploymentId));
    }

    // ── Stats ─────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(approvalService.getStats());
    }
}
