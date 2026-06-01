package com.edra.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user",   columnList = "performed_by"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_time",   columnList = "performed_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AuditAction action;

    // Who did it
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    // What they acted on
    @Column(name = "entity_type", length = 30)
    private String entityType;   // e.g. "DEPLOYMENT", "USER"

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_name", length = 120)
    private String entityName;   // human-readable e.g. "Payment Service v2.1.0"

    // Additional context
    @Column(columnDefinition = "TEXT")
    private String details;      // JSON or plain text with extra info

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "performed_at", nullable = false)
    @Builder.Default
    private LocalDateTime performedAt = LocalDateTime.now();
}
