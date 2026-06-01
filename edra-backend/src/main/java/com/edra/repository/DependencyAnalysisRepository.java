package com.edra.repository;

import com.edra.model.DependencyAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DependencyAnalysisRepository extends JpaRepository<DependencyAnalysis, Long> {
    Optional<DependencyAnalysis> findTopByDeploymentIdOrderByAnalyzedAtDesc(Long deploymentId);
    List<DependencyAnalysis> findAllByOrderByAnalyzedAtDesc();
    List<DependencyAnalysis> findByIsHealthyFalseOrderByAnalyzedAtDesc();
    long countByIsHealthyFalse();
}
