package com.edra.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id", nullable = false, unique = true)
    private Deployment deployment;

    // Total score
    @Column(nullable = false)
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RiskLevel riskLevel;

    // Individual factor contributions
    @Column(name = "score_modified_files")
    private Integer scoreModifiedFiles = 0;

    @Column(name = "score_production")
    private Integer scoreProduction = 0;

    @Column(name = "score_critical_config")
    private Integer scoreCriticalConfig = 0;

    @Column(name = "score_dependency_conflict")
    private Integer scoreDependencyConflict = 0;

    @Column(name = "score_failure_history")
    private Integer scoreFailureHistory = 0;

    // Failure probability (AI placeholder, filled in Bonus phase)
    @Column(name = "failure_probability")
    private Double failureProbability;

    // Recommendation text
    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analyzed_by")
    private User analyzedBy;
}
