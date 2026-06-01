package com.edra.service;

import com.edra.model.*;
import com.edra.payload.request.ApprovalRequest;
import com.edra.payload.response.ApprovalRecordResponse;
import com.edra.payload.response.DeploymentResponse;
import com.edra.repository.ApprovalRecordRepository;
import com.edra.repository.DeploymentRepository;
import com.edra.repository.UserRepository;
import com.edra.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalService {

    private final ApprovalRecordRepository approvalRepo;
    private final DeploymentRepository     deploymentRepo;
    private final UserRepository           userRepo;

    private User getCurrentUser() {
        UserDetailsImpl u = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepo.findById(u.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Approve ───────────────────────────────────────────
    @Transactional
    public ApprovalRecordResponse approve(Long deploymentId, ApprovalRequest req) {
        Deployment dep = deploymentRepo.findById(deploymentId)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        if (dep.getStatus() != DeploymentStatus.PENDING_REVIEW) {
            throw new RuntimeException("Only PENDING_REVIEW deployments can be approved");
        }

        String prevStatus = dep.getStatus().name();
        dep.setStatus(DeploymentStatus.APPROVED);
        deploymentRepo.save(dep);

        ApprovalRecord ar = buildRecord(dep, ApprovalDecision.APPROVED, req.getComment(), prevStatus);
        ApprovalRecord saved = approvalRepo.save(ar);
        log.info("Deployment {} APPROVED by {}", dep.getDeploymentId(), saved.getReviewedBy().getUsername());
        return ApprovalRecordResponse.from(saved);
    }

    // ── Reject ────────────────────────────────────────────
    @Transactional
    public ApprovalRecordResponse reject(Long deploymentId, ApprovalRequest req) {
        Deployment dep = deploymentRepo.findById(deploymentId)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        if (dep.getStatus() != DeploymentStatus.PENDING_REVIEW) {
            throw new RuntimeException("Only PENDING_REVIEW deployments can be rejected");
        }

        String prevStatus = dep.getStatus().name();
        dep.setStatus(DeploymentStatus.REJECTED);
        deploymentRepo.save(dep);

        ApprovalRecord ar = buildRecord(dep, ApprovalDecision.REJECTED, req.getComment(), prevStatus);
        ApprovalRecord saved = approvalRepo.save(ar);
        log.info("Deployment {} REJECTED by {}", dep.getDeploymentId(), saved.getReviewedBy().getUsername());
        return ApprovalRecordResponse.from(saved);
    }

    // ── Mark as Deployed (post-approval) ─────────────────
    @Transactional
    public DeploymentResponse markDeployed(Long deploymentId) {
        Deployment dep = deploymentRepo.findById(deploymentId)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        if (dep.getStatus() != DeploymentStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED deployments can be marked as DEPLOYED");
        }
        dep.setStatus(DeploymentStatus.DEPLOYED);
        return DeploymentResponse.from(deploymentRepo.save(dep));
    }

    // ── Pending Queue ─────────────────────────────────────
    public List<DeploymentResponse> getPendingQueue() {
        return deploymentRepo.findByStatusOrderByCreatedAtDesc(DeploymentStatus.PENDING_REVIEW)
                .stream().map(DeploymentResponse::from).collect(Collectors.toList());
    }

    // ── History ───────────────────────────────────────────
    public List<ApprovalRecordResponse> getApprovalHistory() {
        return approvalRepo.findAllByOrderByReviewedAtDesc()
                .stream().map(ApprovalRecordResponse::from).collect(Collectors.toList());
    }

    public List<ApprovalRecordResponse> getApprovalHistoryForDeployment(Long deploymentId) {
        return approvalRepo.findByDeploymentIdOrderByReviewedAtDesc(deploymentId)
                .stream().map(ApprovalRecordResponse::from).collect(Collectors.toList());
    }

    // ── Stats ─────────────────────────────────────────────
    public Map<String, Long> getStats() {
        return Map.of(
                "totalReviewed", approvalRepo.count(),
                "approved",      approvalRepo.countByDecision(ApprovalDecision.APPROVED),
                "rejected",      approvalRepo.countByDecision(ApprovalDecision.REJECTED),
                "pendingQueue",  deploymentRepo.countByStatus(DeploymentStatus.PENDING_REVIEW)
        );
    }

    // ── Helper ────────────────────────────────────────────
    private ApprovalRecord buildRecord(Deployment dep, ApprovalDecision decision, String comment, String prevStatus) {
        ApprovalRecord ar = new ApprovalRecord();
        ar.setDeployment(dep);
        ar.setDecision(decision);
        ar.setComment(comment);
        ar.setPreviousStatus(prevStatus);
        ar.setReviewedBy(getCurrentUser());
        return ar;
    }
}
