package com.edra.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dependency_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DependencyIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private DependencyAnalysis dependencyAnalysis;

    @Column(name = "source_service", nullable = false)
    private String sourceService;

    @Column(name = "target_service")
    private String targetService;

    @Column(name = "required_version")
    private String requiredVersion;

    @Column(name = "available_version")
    private String availableVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false)
    private DependencyIssueType issueType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueSeverity severity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String resolution;
}
