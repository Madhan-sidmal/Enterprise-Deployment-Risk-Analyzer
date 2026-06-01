package com.edra.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deployments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deployment_id", unique = true, nullable = false, length = 50)
    private String deploymentId;

    @NotBlank
    @Column(name = "application_name", nullable = false, length = 100)
    private String applicationName;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String version;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(nullable = false, length = 20)
    private Environment environment;

    @NotNull
    @Column(name = "deployment_date", nullable = false)
    private LocalDate deploymentDate;

    @Column(name = "deployment_description", columnDefinition = "TEXT")
    private String deploymentDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeploymentStatus status = DeploymentStatus.DRAFT;

    // Metadata for risk scoring (Phase 3)
    @Column(name = "modified_files_count")
    private Integer modifiedFilesCount = 0;

    @Column(name = "has_critical_config_change")
    private Boolean hasCriticalConfigChange = false;

    @Column(name = "has_dependency_conflict")
    private Boolean hasDependencyConflict = false;

    @Column(name = "previous_failure_count")
    private Integer previousFailureCount = 0;

    // Audit fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
