package com.edra.repository;

import com.edra.model.Deployment;
import com.edra.model.DeploymentStatus;
import com.edra.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {

    List<Deployment> findAllByOrderByCreatedAtDesc();

    List<Deployment> findByCreatedByOrderByCreatedAtDesc(User user);

    List<Deployment> findByStatusOrderByCreatedAtDesc(DeploymentStatus status);

    Optional<Deployment> findByDeploymentId(String deploymentId);

    boolean existsByDeploymentId(String deploymentId);

    long countByStatus(DeploymentStatus status);

    @Query("SELECT d FROM Deployment d WHERE d.createdBy = ?1 ORDER BY d.createdAt DESC")
    List<Deployment> findByCreatedByUser(User user);

    @Query("SELECT COUNT(d) FROM Deployment d WHERE d.environment = 'PRODUCTION'")
    long countProductionDeployments();
}
