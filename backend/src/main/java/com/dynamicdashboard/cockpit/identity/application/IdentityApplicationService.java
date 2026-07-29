package com.dynamicdashboard.cockpit.identity.application;

import com.dynamicdashboard.cockpit.identity.application.dto.UserAccountDto;
import com.dynamicdashboard.cockpit.identity.application.mapper.IdentityMapper;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.repository.UserAccountRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.AccountStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IdentityApplicationService {

    private final UserAccountRepository userAccountRepository;
    private final IdentityMapper identityMapper;


    @Transactional
    public UserAccountDto getCurrentUser() {
        UserAccountEntity user = userAccountRepository.findByUsername("ahaddad")
                .orElseGet(() -> {
                    UserAccountEntity newUser = new UserAccountEntity();
                    newUser.setUsername("ahaddad");
                    newUser.setEmail("amine.haddad@prestacode.com");
                    newUser.setDisplayName("Amine Haddad");
                    newUser.setPasswordHash("$2a$10$7Q9b9K...");
                    newUser.setAccountStatus(AccountStatus.ACTIVE);
                    newUser.setLastLoginAt(Instant.now());
                    return userAccountRepository.save(newUser);
                });

        return identityMapper.toDto(user);
    }


    @Transactional(readOnly = true)
    public List<UserAccountDto> getAllUsers() {
        return userAccountRepository.findAll().stream()
                .map(identityMapper::toDto)
                .collect(Collectors.toList());
    }
}
