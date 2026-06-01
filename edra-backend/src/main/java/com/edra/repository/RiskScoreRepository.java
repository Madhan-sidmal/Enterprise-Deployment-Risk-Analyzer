package com.edra.repository;

import com.edra.model.Deployment;
import com.edra.model.RiskLevel;
import com.edra.model.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {

    Optional<RiskScore> findByDeployment(Deployment deployment);

    Optional<RiskScore> findByDeploymentId(Long deploymentId);

    List<RiskScore> findAllByOrderByAnalyzedAtDesc();

    List<RiskScore> findByRiskLevelOrderByScoreDesc(RiskLevel riskLevel);

    long countByRiskLevel(RiskLevel riskLevel);

    @Query("SELECT AVG(r.score) FROM RiskScore r")
    Double findAverageScore();

    @Query("SELECT AVG(r.score) FROM RiskScore r WHERE r.deployment.environment = 'PRODUCTION'")
    Double findAverageScoreForProduction();

    @Query("SELECT r FROM RiskScore r WHERE r.score >= 61 ORDER BY r.score DESC")
    List<RiskScore> findHighRiskDeployments();

    // Analytics helpers — string-based for controller use
    @Query("SELECT COUNT(r) FROM RiskScore r WHERE r.riskLevel = com.edra.model.RiskLevel.LOW")
    long countLow();

    @Query("SELECT COUNT(r) FROM RiskScore r WHERE r.riskLevel = com.edra.model.RiskLevel.MEDIUM")
    long countMedium();

    @Query("SELECT COUNT(r) FROM RiskScore r WHERE r.riskLevel = com.edra.model.RiskLevel.HIGH")
    long countHigh();

    @Query("SELECT AVG(r.score) FROM RiskScore r")
    Optional<Double> averageScore();
}
