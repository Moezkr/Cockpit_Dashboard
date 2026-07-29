package com.dynamicdashboard.cockpit.sharing.domain;
import com.dynamicdashboard.cockpit.dashboard.domain.DashboardEntity;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.domain.UserGroupEntity;
import com.dynamicdashboard.cockpit.query.domain.DataQueryEntity;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.AccessLevel;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.ShareLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
class SharingDomainTest {
    @Test
    @DisplayName("PASS: DashboardShareGrantEntity getter and setter validation")
    void testDashboardShareGrantEntity_Accessors() {
        DashboardShareGrantEntity grant = new DashboardShareGrantEntity();
        UUID grantId = UUID.randomUUID();
        DashboardEntity dashboard = new DashboardEntity();
        UserAccountEntity user = new UserAccountEntity();
        UserGroupEntity group = new UserGroupEntity();
        grant.setId(grantId);
        grant.setDashboard(dashboard);
        grant.setShareLevel(ShareLevel.USERS);
        grant.setGranteeUser(user);
        grant.setGranteeGroup(group);
        grant.setAccessLevel(AccessLevel.EDIT);
        assertEquals(grantId, grant.getId());
        assertEquals(dashboard, grant.getDashboard());
        assertEquals(ShareLevel.USERS, grant.getShareLevel());
        assertEquals(user, grant.getGranteeUser());
        assertEquals(group, grant.getGranteeGroup());
        assertEquals(AccessLevel.EDIT, grant.getAccessLevel());
    }
    @Test
    @DisplayName("PASS: QueryShareGrantEntity getter and setter validation")
    void testQueryShareGrantEntity_Accessors() {
        QueryShareGrantEntity grant = new QueryShareGrantEntity();
        UUID grantId = UUID.randomUUID();
        DataQueryEntity query = new DataQueryEntity();
        UserAccountEntity user = new UserAccountEntity();
        grant.setId(grantId);
        grant.setQuery(query);
        grant.setShareLevel(ShareLevel.GROUP);
        grant.setGranteeUser(user);
        grant.setAccessLevel(AccessLevel.READ);
        assertEquals(grantId, grant.getId());
        assertEquals(query, grant.getQuery());
        assertEquals(ShareLevel.GROUP, grant.getShareLevel());
        assertEquals(user, grant.getGranteeUser());
        assertEquals(AccessLevel.READ, grant.getAccessLevel());
    }
}
