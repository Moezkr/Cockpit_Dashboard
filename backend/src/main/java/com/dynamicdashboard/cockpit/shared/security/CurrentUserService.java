package com.dynamicdashboard.cockpit.shared.security;

import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.repository.UserAccountRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.AccountStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserAccountRepository userAccountRepository;

    @Transactional
    public UserAccountEntity getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String name = auth.getName();
            return userAccountRepository.findByUsername(name)
                    .or(() -> userAccountRepository.findByDisplayName(name))
                    .orElseGet(this::getOrCreateDefaultUser);
        }
        return getOrCreateDefaultUser();
    }

    @Transactional
    public UserAccountEntity getOrCreateDefaultUser() {
        return userAccountRepository.findByUsername("ahaddad")
                .or(() -> userAccountRepository.findByDisplayName("Amine Haddad"))
                .orElseGet(() -> {
                    UserAccountEntity user = new UserAccountEntity();
                    user.setUsername("ahaddad");
                    user.setEmail("amine.haddad@prestacode.com");
                    user.setPasswordHash("$2a$10$7Q9b9K.d1Z...");
                    user.setDisplayName("Amine Haddad");
                    user.setAccountStatus(AccountStatus.ACTIVE);
                    return userAccountRepository.save(user);
                });
    }
}
