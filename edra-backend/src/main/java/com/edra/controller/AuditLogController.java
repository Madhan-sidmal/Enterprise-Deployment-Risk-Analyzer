package com.edra.controller;

import com.edra.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(Map.of(
                "logs",  auditLogService.getAll(page, size),
                "total", auditLogService.getTotalCount(),
                "page",  page,
                "size",  size
        ));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecent() {
        return ResponseEntity.ok(auditLogService.getRecent());
    }

    @GetMapping("/entity/{type}/{id}")
    public ResponseEntity<List<Map<String, Object>>> getForEntity(
            @PathVariable String type, @PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getForEntity(type, id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(auditLogService.getStats());
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(Map.of(
                "logs", auditLogService.search(q, page, size),
                "query", q
        ));
    }
}
