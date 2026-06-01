package com.edra.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "rollback_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RollbackPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id", nullable = false)
    private Deployment deployment;

    // Rollback target
    @Column(name = "rollback_to_version", nullable = false)
    private String rollbackToVersion;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    // Simulation results
    @Column(name = "estimated_downtime_minutes")
    private Integer estimatedDowntimeMinutes;

    @Column(name = "steps_count")
    private Integer stepsCount;

    @Column(name = "simulation_steps", columnDefinition = "TEXT")
    private String simulationSteps; // JSON array stored as text

    @Column(name = "feasibility_score")   // 0-100
    private Integer feasibilityScore;

    @Column(name = "feasibility_label")   // "High", "Medium", "Low"
    private String feasibilityLabel;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RollbackStatus status = RollbackStatus.SIMULATED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "executed_at")
    private LocalDateTime executedAt;
}
