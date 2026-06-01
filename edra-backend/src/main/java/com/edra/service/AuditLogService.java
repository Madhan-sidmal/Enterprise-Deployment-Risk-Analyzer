package com.edra.service;

import com.edra.model.AuditAction;
import com.edra.model.AuditLog;
import com.edra.model.User;
import com.edra.repository.AuditLogRepository;
import com.edra.repository.UserRepository;
import com.edra.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditRepo;
    private final UserRepository userRepo;

    // ── Write (async, fire-and-forget) ────────────────────
    @Async
    public void log(AuditAction action, String entityType, Long entityId, String entityName, String details) {
        try {
            User actor = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl ud) {
                actor = userRepo.findById(ud.getId()).orElse(null);
            }
            AuditLog entry = AuditLog.builder()
                    .action(action)
                    .performedBy(actor)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .details(details)
                    .build();
            auditRepo.save(entry);
        } catch (Exception e) {
            log.warn("Audit log failed: {}", e.getMessage());
        }
    }

    // Convenience overload
    public void log(AuditAction action, String entityType, Long entityId, String entityName) {
        log(action, entityType, entityId, entityName, null);
    }

    // ── Read ──────────────────────────────────────────────
    public List<Map<String, Object>> getAll(int page, int size) {
        return auditRepo.findAllByOrderByPerformedAtDesc(PageRequest.of(page, size))
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    public long getTotalCount() {
        return auditRepo.count();
    }

    public List<Map<String, Object>> getRecent() {
        return auditRepo.findTop10ByOrderByPerformedAtDesc()
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getForEntity(String type, Long id) {
        return auditRepo.findByEntityTypeAndEntityIdOrderByPerformedAtDesc(type, id)
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    public Map<String, Object> getStats() {
        long total = auditRepo.count();
        Map<String, Long> byAction = new LinkedHashMap<>();
        auditRepo.countByAction().forEach(row -> byAction.put(row[0].toString(), (Long) row[1]));
        return Map.of("total", total, "byAction", byAction);
    }

    public List<Map<String, Object>> search(String q, int page, int size) {
        return auditRepo.searchByEntityName(q, PageRequest.of(page, size))
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    private Map<String, Object> toMap(AuditLog a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("action", a.getAction().name());
        m.put("entityType", a.getEntityType());
        m.put("entityId", a.getEntityId());
        m.put("entityName", a.getEntityName());
        m.put("details", a.getDetails());
        m.put("performedAt", a.getPerformedAt());
        if (a.getPerformedBy() != null) {
            m.put("performedByUsername", a.getPerformedBy().getUsername());
            m.put("performedByFullName", a.getPerformedBy().getFullName());
            m.put("performedByRole", a.getPerformedBy().getRole().name());
        } else {
            m.put("performedByUsername", "SYSTEM");
            m.put("performedByFullName", "System");
            m.put("performedByRole", "SYSTEM");
        }
        return m;
    }
}
