package com.dynamicdashboard.cockpit.catalog.domain;

import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.HostApplication;
import com.dynamicdashboard.cockpit.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "data_source", schema = "cockpit")
public class DataSourceEntity extends AuditableEntity {

    @Column(name = "source_key", nullable = false, length = 120, unique = true)
    private String sourceKey;

    @Column(name = "source_label", nullable = false, length = 160)
    private String sourceLabel;

    @Column(name = "source_description", length = 400)
    private String sourceDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "host_application", nullable = false, length = 40)
    private HostApplication hostApplication;

    @Column(name = "table_name", length = 160)
    private String tableName;

    @Column(name = "active", nullable = false)
    private boolean active;
}
