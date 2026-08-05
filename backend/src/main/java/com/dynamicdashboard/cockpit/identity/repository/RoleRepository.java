package com.dynamicdashboard.cockpit.identity.repository;
import com.dynamicdashboard.cockpit.identity.domain.RoleEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RoleRepository extends JpaRepository<RoleEntity, UUID> {
    Optional<RoleEntity> findByRoleName(String roleName);
}
