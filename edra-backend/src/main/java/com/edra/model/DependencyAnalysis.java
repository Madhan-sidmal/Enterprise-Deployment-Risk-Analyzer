package com.edra.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dependency_analysis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DependencyAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id", nullable = false)
    private Deployment deployment;

    // Overall health
    @Column(name = "total_dependencies")
    private Integer totalDependencies = 0;

    @Column(name = "issue_count")
    private Integer issueCount = 0;

    @Column(name = "is_healthy")
    private Boolean isHealthy = true;

    // Embedded issues as JSON-style in child table
    @OneToMany(mappedBy = "dependencyAnalysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DependencyIssue> issues = new ArrayList<>();

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analyzed_by")
    private User analyzedBy;
}
