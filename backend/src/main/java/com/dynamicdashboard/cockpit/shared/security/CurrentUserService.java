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
    @Transactional(readOnly = true)
    public UserAccountEntity getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String name = auth.getName();
            return userAccountRepository.findByUsername(name)
                    .or(() -> userAccountRepository.findByDisplayName(name))
                    .orElseGet(this::getDefaultSeededUser);
        }
        return getDefaultSeededUser();
    }
    @Transactional(readOnly = true)
    public UserAccountEntity getDefaultSeededUser() {
        return userAccountRepository.findByUsername("ahaddad")
                .or(() -> userAccountRepository.findByDisplayName("Amine Haddad"))
                .orElseThrow(() -> new IllegalStateException("Default user 'ahaddad' not found. Please ensure database seed V3__cockpit_seed.sql was executed."));
    }
}
