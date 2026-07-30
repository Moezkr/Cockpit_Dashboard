package com.dynamicdashboard.cockpit.shared.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class ExternalDataSourceConfiguration {

    @Value("${spring.datasource.url}")
    private String cockpitUrl;

    @Value("${spring.datasource.username}")
    private String cockpitUser;

    @Value("${spring.datasource.password}")
    private String cockpitPassword;

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

    @PostConstruct
    public void migrateErpDatabase() {
        Flyway erpFlyway = Flyway.configure()
                .dataSource(erpUrl, erpUsername, erpPassword)
                .locations("classpath:db/migration/erp", "classpath:db/seeder/erp")
                .schemas("erp_db")
                .defaultSchema("erp_db")
                .baselineOnMigrate(true)
                .validateOnMigrate(false)
                .load();
        erpFlyway.migrate();
    }

    @Bean(name = "dataSource")
    @org.springframework.context.annotation.Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cockpitUrl);
        config.setUsername(cockpitUser);
        config.setPassword(cockpitPassword);
        config.setDriverClassName("org.postgresql.Driver");
        config.setPoolName("Cockpit-HikariPool");
        config.setMaximumPoolSize(16);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        return new HikariDataSource(config);
    }

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
