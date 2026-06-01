package com.edra.service;

import com.edra.model.*;
import com.edra.payload.request.DeploymentRequest;
import com.edra.payload.response.DeploymentResponse;
import com.edra.repository.DeploymentRepository;
import com.edra.repository.UserRepository;
import com.edra.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeploymentService {

    private final DeploymentRepository deploymentRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdminOrRM() {
        UserDetailsImpl userDetails = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_RELEASE_MANAGER"));
    }

    private String generateDeploymentId(String appName) {
        String prefix = appName.replaceAll("\\s+", "").toUpperCase();
        if (prefix.length() > 6) prefix = prefix.substring(0, 6);
        String suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "DEP-" + prefix + "-" + suffix;
    }

    @Transactional
    public DeploymentResponse createDeployment(DeploymentRequest request) {
        User creator = getCurrentUser();

        Deployment d = new Deployment();
        d.setDeploymentId(generateDeploymentId(request.getApplicationName()));
        d.setApplicationName(request.getApplicationName());
        d.setVersion(request.getVersion());
        d.setEnvironment(Environment.valueOf(request.getEnvironment()));
        d.setDeploymentDate(request.getDeploymentDate());
        d.setDeploymentDescription(request.getDeploymentDescription());
        d.setStatus(DeploymentStatus.DRAFT);
        d.setModifiedFilesCount(request.getModifiedFilesCount() != null ? request.getModifiedFilesCount() : 0);
        d.setHasCriticalConfigChange(request.getHasCriticalConfigChange() != null ? request.getHasCriticalConfigChange() : false);
        d.setHasDependencyConflict(request.getHasDependencyConflict() != null ? request.getHasDependencyConflict() : false);
        d.setPreviousFailureCount(request.getPreviousFailureCount() != null ? request.getPreviousFailureCount() : 0);
        d.setCreatedBy(creator);

        return DeploymentResponse.from(deploymentRepository.save(d));
    }

    public List<DeploymentResponse> getAllDeployments() {
        List<Deployment> deployments;
        if (isAdminOrRM()) {
            deployments = deploymentRepository.findAllByOrderByCreatedAtDesc();
        } else {
            deployments = deploymentRepository.findByCreatedByOrderByCreatedAtDesc(getCurrentUser());
        }
        return deployments.stream().map(DeploymentResponse::from).collect(Collectors.toList());
    }

    public DeploymentResponse getDeploymentById(Long id) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deployment not found with id: " + id));
        // Developers can only see their own; admin/RM see all
        if (!isAdminOrRM() && !d.getCreatedBy().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Access denied");
        }
        return DeploymentResponse.from(d);
    }

    @Transactional
    public DeploymentResponse updateDeployment(Long id, DeploymentRequest request) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        if (!isAdminOrRM() && !d.getCreatedBy().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Access denied");
        }
        if (d.getStatus() != DeploymentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT deployments can be edited");
        }

        d.setApplicationName(request.getApplicationName());
        d.setVersion(request.getVersion());
        d.setEnvironment(Environment.valueOf(request.getEnvironment()));
        d.setDeploymentDate(request.getDeploymentDate());
        d.setDeploymentDescription(request.getDeploymentDescription());
        d.setModifiedFilesCount(request.getModifiedFilesCount() != null ? request.getModifiedFilesCount() : 0);
        d.setHasCriticalConfigChange(request.getHasCriticalConfigChange() != null ? request.getHasCriticalConfigChange() : false);
        d.setHasDependencyConflict(request.getHasDependencyConflict() != null ? request.getHasDependencyConflict() : false);
        d.setPreviousFailureCount(request.getPreviousFailureCount() != null ? request.getPreviousFailureCount() : 0);

        return DeploymentResponse.from(deploymentRepository.save(d));
    }

    @Transactional
    public DeploymentResponse submitForReview(Long id) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        if (!isAdminOrRM() && !d.getCreatedBy().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Access denied");
        }
        if (d.getStatus() != DeploymentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT deployments can be submitted for review");
        }
        d.setStatus(DeploymentStatus.PENDING_REVIEW);
        return DeploymentResponse.from(deploymentRepository.save(d));
    }

    @Transactional
    public void deleteDeployment(Long id) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        if (!isAdminOrRM() && !d.getCreatedBy().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Access denied");
        }
        if (d.getStatus() != DeploymentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT deployments can be deleted");
        }
        deploymentRepository.delete(d);
    }

    public java.util.Map<String, Long> getDeploymentStats() {
        return java.util.Map.of(
            "total",           deploymentRepository.count(),
            "draft",           deploymentRepository.countByStatus(DeploymentStatus.DRAFT),
            "pendingReview",   deploymentRepository.countByStatus(DeploymentStatus.PENDING_REVIEW),
            "approved",        deploymentRepository.countByStatus(DeploymentStatus.APPROVED),
            "rejected",        deploymentRepository.countByStatus(DeploymentStatus.REJECTED),
            "deployed",        deploymentRepository.countByStatus(DeploymentStatus.DEPLOYED),
            "production",      deploymentRepository.countProductionDeployments()
        );
    }
}
