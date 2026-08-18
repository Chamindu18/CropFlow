package com.cropflow.security.principal;

import com.cropflow.user.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

public class CropFlowUserPrincipal implements UserDetails {

    private final UUID userId;
    private final String email;
    private final String passwordHash;
    private final String role;
    private final boolean enabled;

    public CropFlowUserPrincipal(User user) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole().name();
        this.enabled = user.getStatus().name().equals("ACTIVE");
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return java.util.List.of(
                new SimpleGrantedAuthority("ROLE_" + role)
        );
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}