package com.edra.payload.response;

import com.edra.model.Deployment;
import com.edra.model.DeploymentStatus;
import com.edra.model.Environment;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DeploymentResponse {

    private Long id;
    private String deploymentId;
    private String applicationName;
    private String version;
    private Environment environment;
    private LocalDate deploymentDate;
    private String deploymentDescription;
    private DeploymentStatus status;

    // Risk factors
    private Integer modifiedFilesCount;
    private Boolean hasCriticalConfigChange;
    private Boolean hasDependencyConflict;
    private Integer previousFailureCount;

    // Creator info
    private Long createdById;
    private String createdByUsername;
    private String createdByFullName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DeploymentResponse from(Deployment d) {
        DeploymentResponse r = new DeploymentResponse();
        r.setId(d.getId());
        r.setDeploymentId(d.getDeploymentId());
        r.setApplicationName(d.getApplicationName());
        r.setVersion(d.getVersion());
        r.setEnvironment(d.getEnvironment());
        r.setDeploymentDate(d.getDeploymentDate());
        r.setDeploymentDescription(d.getDeploymentDescription());
        r.setStatus(d.getStatus());
        r.setModifiedFilesCount(d.getModifiedFilesCount());
        r.setHasCriticalConfigChange(d.getHasCriticalConfigChange());
        r.setHasDependencyConflict(d.getHasDependencyConflict());
        r.setPreviousFailureCount(d.getPreviousFailureCount());
        r.setCreatedAt(d.getCreatedAt());
        r.setUpdatedAt(d.getUpdatedAt());
        if (d.getCreatedBy() != null) {
            r.setCreatedById(d.getCreatedBy().getId());
            r.setCreatedByUsername(d.getCreatedBy().getUsername());
            r.setCreatedByFullName(d.getCreatedBy().getFullName());
        }
        return r;
    }
}
