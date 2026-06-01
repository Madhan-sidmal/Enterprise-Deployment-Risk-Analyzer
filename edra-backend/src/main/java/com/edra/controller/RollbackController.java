package com.edra.controller;

import com.edra.payload.request.RollbackSimulationRequest;
import com.edra.payload.response.RollbackPlanResponse;
import com.edra.service.RollbackSimulatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rollback")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class RollbackController {

    private final RollbackSimulatorService service;

    @PostMapping("/simulate")
    public ResponseEntity<RollbackPlanResponse> simulate(@RequestBody RollbackSimulationRequest req) {
        return ResponseEntity.ok(service.simulate(req));
    }

    @PatchMapping("/{id}/initiate")
    public ResponseEntity<RollbackPlanResponse> initiate(@PathVariable Long id) {
        return ResponseEntity.ok(service.initiateRollback(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RollbackPlanResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/deployment/{deploymentId}")
    public ResponseEntity<List<RollbackPlanResponse>> getForDeployment(@PathVariable Long deploymentId) {
        return ResponseEntity.ok(service.getForDeployment(deploymentId));
    }

    @GetMapping
    public ResponseEntity<List<RollbackPlanResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(service.getStats());
    }
}
