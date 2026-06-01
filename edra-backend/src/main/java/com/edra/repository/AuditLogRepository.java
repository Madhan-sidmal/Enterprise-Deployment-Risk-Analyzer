package com.edra.repository;

import com.edra.model.AuditAction;
import com.edra.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Paginated full list
    Page<AuditLog> findAllByOrderByPerformedAtDesc(Pageable pageable);

    // By user
    Page<AuditLog> findByPerformedByIdOrderByPerformedAtDesc(Long userId, Pageable pageable);

    // By action
    Page<AuditLog> findByActionOrderByPerformedAtDesc(AuditAction action, Pageable pageable);

    // By entity
    List<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, Long entityId);

    // By date range
    Page<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    // Stats — count by action
    @Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action")
    List<Object[]> countByAction();

    // Recent activity (for dashboard)
    List<AuditLog> findTop10ByOrderByPerformedAtDesc();

    // Search by entity name
    @Query("SELECT a FROM AuditLog a WHERE LOWER(a.entityName) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY a.performedAt DESC")
    Page<AuditLog> searchByEntityName(@Param("q") String query, Pageable pageable);
}
