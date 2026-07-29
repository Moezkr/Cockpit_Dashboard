package com.dynamicdashboard.cockpit.identity.repository;

import com.dynamicdashboard.cockpit.identity.domain.RolePermissionEntity;
import com.dynamicdashboard.cockpit.identity.domain.RolePermissionEntity.RolePermissionId;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, RolePermissionId> {

    long countByIdRoleId(UUID roleId);
}
