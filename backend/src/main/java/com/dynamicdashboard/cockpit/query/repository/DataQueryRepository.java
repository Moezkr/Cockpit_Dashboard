package com.dynamicdashboard.cockpit.query.repository;
import com.dynamicdashboard.cockpit.query.domain.DataQueryEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DataQueryRepository extends JpaRepository<DataQueryEntity, UUID> {
    List<DataQueryEntity> findByOwnerId(UUID ownerId);
}
