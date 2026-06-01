package com.edra.model;

public enum AuditAction {
    // Auth
    USER_REGISTERED,
    USER_LOGGED_IN,
    USER_LOGGED_OUT,

    // Deployments
    DEPLOYMENT_CREATED,
    DEPLOYMENT_UPDATED,
    DEPLOYMENT_DELETED,
    DEPLOYMENT_SUBMITTED,
    DEPLOYMENT_DEPLOYED,

    // Approvals
    DEPLOYMENT_APPROVED,
    DEPLOYMENT_REJECTED,

    // Risk
    RISK_ANALYZED,

    // Dependencies
    DEPENDENCY_ANALYZED,

    // Rollback
    ROLLBACK_SIMULATED,
    ROLLBACK_INITIATED
}
