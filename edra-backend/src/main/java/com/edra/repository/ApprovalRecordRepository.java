package com.edra.repository;

import com.edra.model.ApprovalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRecordRepository extends JpaRepository<ApprovalRecord, Long> {
    List<ApprovalRecord> findByDeploymentIdOrderByReviewedAtDesc(Long deploymentId);
    List<ApprovalRecord> findAllByOrderByReviewedAtDesc();
    long countByDecision(com.edra.model.ApprovalDecision decision);
}
