package com.edra.payload.response;

import com.edra.model.ApprovalRecord;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApprovalRecordResponse {

    private Long   id;
    private Long   deploymentId;
    private String deploymentUniqueId;
    private String applicationName;
    private String environment;
    private String currentStatus;  // deployment status after action
    private String previousStatus;

    private String decision;  // APPROVED | REJECTED
    private String comment;

    private Long   reviewedById;
    private String reviewedByUsername;
    private String reviewedByFullName;
    private LocalDateTime reviewedAt;

    public static ApprovalRecordResponse from(ApprovalRecord ar) {
        ApprovalRecordResponse r = new ApprovalRecordResponse();
        r.setId(ar.getId());
        r.setDecision(ar.getDecision().name());
        r.setComment(ar.getComment());
        r.setPreviousStatus(ar.getPreviousStatus());
        r.setReviewedAt(ar.getReviewedAt());

        if (ar.getDeployment() != null) {
            r.setDeploymentId(ar.getDeployment().getId());
            r.setDeploymentUniqueId(ar.getDeployment().getDeploymentId());
            r.setApplicationName(ar.getDeployment().getApplicationName());
            r.setEnvironment(ar.getDeployment().getEnvironment().name());
            r.setCurrentStatus(ar.getDeployment().getStatus().name());
        }
        if (ar.getReviewedBy() != null) {
            r.setReviewedById(ar.getReviewedBy().getId());
            r.setReviewedByUsername(ar.getReviewedBy().getUsername());
            r.setReviewedByFullName(ar.getReviewedBy().getFullName());
        }
        return r;
    }
}
