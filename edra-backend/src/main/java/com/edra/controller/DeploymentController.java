package com.edra.controller;

import com.edra.payload.request.DeploymentRequest;
import com.edra.payload.response.DeploymentResponse;
import com.edra.payload.response.MessageResponse;
import com.edra.service.DeploymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deployments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DeploymentController {

    private final DeploymentService deploymentService;

    // ── CREATE ────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<DeploymentResponse> createDeployment(
            @Valid @RequestBody DeploymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deploymentService.createDeployment(request));
    }

    // ── READ ALL ──────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<DeploymentResponse>> getAllDeployments() {
        return ResponseEntity.ok(deploymentService.getAllDeployments());
    }

    // ── READ ONE ──────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<DeploymentResponse> getDeployment(@PathVariable Long id) {
        return ResponseEntity.ok(deploymentService.getDeploymentById(id));
    }

    // ── UPDATE ────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<DeploymentResponse> updateDeployment(
            @PathVariable Long id,
            @Valid @RequestBody DeploymentRequest request) {
        return ResponseEntity.ok(deploymentService.updateDeployment(id, request));
    }

    // ── SUBMIT FOR REVIEW ─────────────────────────────────
    @PatchMapping("/{id}/submit")
    public ResponseEntity<DeploymentResponse> submitForReview(@PathVariable Long id) {
        return ResponseEntity.ok(deploymentService.submitForReview(id));
    }

    // ── DELETE ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteDeployment(@PathVariable Long id) {
        deploymentService.deleteDeployment(id);
        return ResponseEntity.ok(new MessageResponse("Deployment deleted successfully"));
    }

    // ── STATS ─────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(deploymentService.getDeploymentStats());
    }
}
