package com.edra;

import com.edra.model.*;
import com.edra.service.RiskScoreService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration smoke tests — verifies the Spring context loads correctly
 * and core services are wired without a real database connection.
 * Uses H2 in-memory DB (see src/test/resources/application.properties).
 */
@SpringBootTest
@ActiveProfiles("test")
class EdraApplicationTests {

    @Autowired
    private RiskScoreService riskScoreService;

    @Test
    @DisplayName("Spring application context loads successfully")
    void contextLoads() {
        // If we reach here, the context started without errors
        assertThat(riskScoreService).isNotNull();
    }

    @Test
    @DisplayName("Risk score calculation — low risk deployment")
    void riskScoreCalculation_LowRisk() {
        Deployment dep = new Deployment();
        dep.setEnvironment(Environment.DEVELOPMENT);
        dep.setModifiedFilesCount(5);
        dep.setHasCriticalConfigChange(false);
        dep.setHasDependencyConflict(false);
        dep.setPreviousFailureCount(0);

        int score = riskScoreService.calculateScore(dep);

        assertThat(score).isBetween(0, 30);
    }

    @Test
    @DisplayName("Risk score calculation — high risk deployment")
    void riskScoreCalculation_HighRisk() {
        Deployment dep = new Deployment();
        dep.setEnvironment(Environment.PRODUCTION);
        dep.setModifiedFilesCount(80);
        dep.setHasCriticalConfigChange(true);
        dep.setHasDependencyConflict(true);
        dep.setPreviousFailureCount(5);

        int score = riskScoreService.calculateScore(dep);

        assertThat(score).isGreaterThan(60);
    }

    @Test
    @DisplayName("Risk level determination from score")
    void riskLevelFromScore() {
        assertThat(riskScoreService.determineRiskLevel(15)).isEqualTo(RiskLevel.LOW);
        assertThat(riskScoreService.determineRiskLevel(45)).isEqualTo(RiskLevel.MEDIUM);
        assertThat(riskScoreService.determineRiskLevel(80)).isEqualTo(RiskLevel.HIGH);
    }
}
