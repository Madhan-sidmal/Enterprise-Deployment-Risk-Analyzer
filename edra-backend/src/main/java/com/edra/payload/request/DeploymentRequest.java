package com.edra.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DeploymentRequest {

    @NotBlank(message = "Application name is required")
    private String applicationName;

    @NotBlank(message = "Version is required")
    private String version;

    @NotNull(message = "Environment is required")
    private String environment;

    @NotNull(message = "Deployment date is required")
    private LocalDate deploymentDate;

    private String deploymentDescription;

    // Risk factors (optional at creation, used in Phase 3)
    private Integer modifiedFilesCount = 0;
    private Boolean hasCriticalConfigChange = false;
    private Boolean hasDependencyConflict = false;
    private Integer previousFailureCount = 0;
}
