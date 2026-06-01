package com.edra.controller;

import com.edra.payload.request.DependencyAnalysisRequest;
import com.edra.payload.response.DependencyAnalysisResponse;
import com.edra.service.DependencyAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dependencies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DependencyController {

    private final DependencyAnalysisService service;

    @PostMapping("/analyze")
    public ResponseEntity<DependencyAnalysisResponse> analyze(
            @RequestBody DependencyAnalysisRequest request) {
        return ResponseEntity.ok(service.analyze(request));
    }

    @GetMapping("/deployment/{deploymentId}")
    public ResponseEntity<DependencyAnalysisResponse> getLatest(
            @PathVariable Long deploymentId) {
        return ResponseEntity.ok(service.getLatestForDeployment(deploymentId));
    }

    @GetMapping
    public ResponseEntity<List<DependencyAnalysisResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getStats());
    }
}
