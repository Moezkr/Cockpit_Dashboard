package com.dynamicdashboard.cockpit.shared.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class ExternalDataSourceConfiguration {

    @Value("${cockpit.external-connectors.progescode-erp.url}")
    private String erpUrl;

    @Value("${cockpit.external-connectors.progescode-erp.username}")
    private String erpUsername;

    @Value("${cockpit.external-connectors.progescode-erp.password}")
    private String erpPassword;

    @Value("${cockpit.external-connectors.progescode-erp.hikari.pool-name:ERP-HikariPool}")
    private String erpPoolName;

    @Value("${cockpit.external-connectors.progescode-erp.hikari.maximum-pool-size:10}")
    private int erpMaxPoolSize;

    @Value("${cockpit.external-connectors.progescode-erp.hikari.minimum-idle:2}")
    private int erpMinIdle;

    @Value("${cockpit.external-connectors.progescode-erp.hikari.connection-timeout:20000}")
    private long erpConnectionTimeout;

    @Bean(name = "erpDataSource")
    public DataSource erpDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(erpUrl);
        config.setUsername(erpUsername);
        config.setPassword(erpPassword);
        config.setDriverClassName("org.postgresql.Driver");
        config.setPoolName(erpPoolName);
        config.setMaximumPoolSize(erpMaxPoolSize);
        config.setMinimumIdle(erpMinIdle);
        config.setConnectionTimeout(erpConnectionTimeout);
        return new HikariDataSource(config);
    }

    @Bean(name = "erpJdbcTemplate")
    public JdbcTemplate erpJdbcTemplate() {
        return new JdbcTemplate(erpDataSource());
    }
}
