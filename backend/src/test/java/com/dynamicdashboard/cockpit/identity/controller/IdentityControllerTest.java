package com.dynamicdashboard.cockpit.identity.controller;
import com.dynamicdashboard.cockpit.identity.application.IdentityApplicationService;
import com.dynamicdashboard.cockpit.identity.application.dto.UserAccountDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import java.util.UUID;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@ExtendWith(MockitoExtension.class)
class IdentityControllerTest {
    private MockMvc mockMvc;
    @Mock
    private IdentityApplicationService identityApplicationService;
    @InjectMocks
    private IdentityController identityController;
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(identityController).build();
    }
    @Test
    @DisplayName("PASS: GET /api/identity/me returns 200 OK and user info")
    void testGetCurrentUser_Returns200() throws Exception {
        UserAccountDto user = UserAccountDto.builder()
                .id(UUID.randomUUID())
                .username("ahaddad")
                .displayName("Amine Haddad")
                .accountStatus("active")
                .build();
        when(identityApplicationService.getCurrentUser()).thenReturn(user);
        mockMvc.perform(get("/api/identity/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ahaddad"))
                .andExpect(jsonPath("$.displayName").value("Amine Haddad"));
    }
    @Test
    @DisplayName("PASS: GET /api/identity/users returns 200 OK and list of users")
    void testGetAllUsers_Returns200() throws Exception {
        UserAccountDto user = UserAccountDto.builder()
                .id(UUID.randomUUID())
                .username("ahaddad")
                .build();
        when(identityApplicationService.getAllUsers()).thenReturn(List.of(user));
        mockMvc.perform(get("/api/identity/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("ahaddad"));
    }
}
