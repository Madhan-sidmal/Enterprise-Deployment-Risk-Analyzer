package com.edra.payload.request;

import lombok.Data;
import java.util.List;

@Data
public class DependencyAnalysisRequest {

    private Long deploymentId;

    /**
     * List of service nodes in the dependency graph.
     * Each node: { "name": "ServiceA", "version": "2.1.0" }
     */
    private List<ServiceNode> services;

    /**
     * List of declared dependencies between services.
     * Each edge: { "from": "ServiceA", "to": "ServiceB", "requiredVersion": "1.x" }
     */
    private List<DependencyEdge> dependencies;

    @Data
    public static class ServiceNode {
        private String name;
        private String version;
    }

    @Data
    public static class DependencyEdge {
        private String from;
        private String to;
        private String requiredVersion;  // can be null (means any)
    }
}
