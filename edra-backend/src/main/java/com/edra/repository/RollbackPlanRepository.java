package com.edra.repository;

import com.edra.model.RollbackPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RollbackPlanRepository extends JpaRepository<RollbackPlan, Long> {
    List<RollbackPlan> findByDeploymentIdOrderByCreatedAtDesc(Long deploymentId);
    List<RollbackPlan> findAllByOrderByCreatedAtDesc();
    long countByStatus(com.edra.model.RollbackStatus status);
}
