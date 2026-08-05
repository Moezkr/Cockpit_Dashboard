package com.dynamicdashboard.cockpit.sharing.repository;
import com.dynamicdashboard.cockpit.sharing.domain.QueryShareGrantEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface QueryShareGrantRepository extends JpaRepository<QueryShareGrantEntity, UUID> {
    List<QueryShareGrantEntity> findByQueryId(UUID queryId);
}
