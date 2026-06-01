package com.edra.payload.request;

import lombok.Data;

@Data
public class RollbackSimulationRequest {
    private Long   deploymentId;
    private String rollbackToVersion;
    private String reason;
}
