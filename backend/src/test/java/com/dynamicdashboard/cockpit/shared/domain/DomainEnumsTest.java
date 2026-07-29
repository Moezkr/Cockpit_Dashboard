package com.dynamicdashboard.cockpit.shared.domain;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class DomainEnumsTest {
    @Test
    @DisplayName("PASS: Validate domain enum values exist and are non-empty")
    void testEnumValues() {
        assertTrue(DashboardStatus.values().length > 0);
        assertTrue(ShareLevel.values().length > 0);
        assertTrue(WidgetType.values().length > 0);
        assertTrue(RefreshInterval.values().length > 0);
        assertTrue(FieldType.values().length > 0);
        assertTrue(FilterOperator.values().length > 0);
        assertTrue(AggregationType.values().length > 0);
        assertTrue(QueryVisibility.values().length > 0);
        assertTrue(AccountStatus.values().length > 0);
        assertEquals(DashboardStatus.DRAFT, DashboardStatus.valueOf("DRAFT"));
        assertEquals(ShareLevel.PRIVATE, ShareLevel.valueOf("PRIVATE"));
        assertEquals(WidgetType.KPI, WidgetType.valueOf("KPI"));
    }
    @Test
    @DisplayName("FAIL/EDGE: Invalid enum value throws IllegalArgumentException")
    void testInvalidEnumValue_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> DashboardStatus.valueOf("INVALID_STATUS"));
        assertThrows(IllegalArgumentException.class, () -> WidgetType.valueOf("NON_EXISTING"));
    }
}
