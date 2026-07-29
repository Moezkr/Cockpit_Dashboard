package com.dynamicdashboard.cockpit.identity.application;
import com.dynamicdashboard.cockpit.identity.application.dto.UserAccountDto;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.repository.UserAccountRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.AccountStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.dynamicdashboard.cockpit.identity.application.mapper.IdentityMapper;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IdentityApplicationServiceTest {
    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private IdentityMapper identityMapper;
    @InjectMocks
    private IdentityApplicationService identityApplicationService;
    private UserAccountEntity mockUser;
    @BeforeEach
    void setUp() {
        mockUser = new UserAccountEntity();
        mockUser.setId(UUID.randomUUID());
        mockUser.setUsername("ahaddad");
        mockUser.setEmail("amine.haddad@prestacode.com");
        mockUser.setDisplayName("Amine Haddad");
        mockUser.setAccountStatus(AccountStatus.ACTIVE);

        when(identityMapper.toDto(any())).thenAnswer(invocation -> {
            UserAccountEntity user = invocation.getArgument(0);
            return UserAccountDto.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .displayName(user.getDisplayName())
                    .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name().toLowerCase() : "active")
                    .build();
        });
    }
    @Test
    @DisplayName("PASS: Get current user returns existing user account")
    void testGetCurrentUser_ExistingUser() {
        when(userAccountRepository.findByUsername("ahaddad")).thenReturn(Optional.of(mockUser));
        UserAccountDto result = identityApplicationService.getCurrentUser();
        assertNotNull(result);
        assertEquals("ahaddad", result.getUsername());
        assertEquals("Amine Haddad", result.getDisplayName());
        assertEquals("active", result.getAccountStatus());
    }
    @Test
    @DisplayName("PASS: Get current user auto-creates default user when not found")
    void testGetCurrentUser_UserNotFound_CreatesNewUser() {
        when(userAccountRepository.findByUsername("ahaddad")).thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccountEntity.class))).thenAnswer(i -> {
            UserAccountEntity user = i.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });
        UserAccountDto result = identityApplicationService.getCurrentUser();
        assertNotNull(result);
        assertEquals("ahaddad", result.getUsername());
        assertEquals("Amine Haddad", result.getDisplayName());
        verify(userAccountRepository, times(1)).save(any(UserAccountEntity.class));
    }
    @Test
    @DisplayName("PASS: Retrieve all users returns list of user accounts")
    void testGetAllUsers_Success() {
        when(userAccountRepository.findAll()).thenReturn(List.of(mockUser));
        List<UserAccountDto> users = identityApplicationService.getAllUsers();
        assertNotNull(users);
        assertEquals(1, users.size());
        assertEquals("ahaddad", users.get(0).getUsername());
    }
    @Test
    @DisplayName("FAIL/EDGE: Retrieve all users returns empty list when no users exist")
    void testGetAllUsers_Empty() {
        when(userAccountRepository.findAll()).thenReturn(Collections.emptyList());
        List<UserAccountDto> users = identityApplicationService.getAllUsers();
        assertNotNull(users);
        assertTrue(users.isEmpty());
    }
}
