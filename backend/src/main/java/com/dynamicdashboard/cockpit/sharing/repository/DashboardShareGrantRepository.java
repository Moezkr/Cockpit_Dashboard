package com.dynamicdashboard.cockpit.sharing.repository;
import com.dynamicdashboard.cockpit.sharing.domain.DashboardShareGrantEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DashboardShareGrantRepository extends JpaRepository<DashboardShareGrantEntity, UUID> {
    List<DashboardShareGrantEntity> findByDashboardId(UUID dashboardId);
}
