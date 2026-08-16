package com.cropflow.auth.service;

import com.cropflow.auth.dto.RegistrationRequest;
import com.cropflow.auth.dto.RegistrationResponse;
import com.cropflow.security.PasswordService;
import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserRole;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public AuthService(
            UserRepository userRepository,
            PasswordService passwordService
    ) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @Transactional
    public RegistrationResponse register(RegistrationRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RegistrationConflictException(
                    "An account with this email already exists."
            );
        }

        User user = new User(
                normalizedEmail,
                passwordService.hash(request.password()),
                request.firstName().trim(),
                request.lastName().trim(),
                normalizePhone(request.phone()),
                mapRole(request.role()),
                UserStatus.PENDING_VERIFICATION
        );

        User savedUser = userRepository.save(user);

        return new RegistrationResponse(
                "Registration successful. Please verify your email.",
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getStatus()
        );
    }

    private UserRole mapRole(com.cropflow.auth.dto.RegistrationRole role) {
        return switch (role) {
            case FARMER -> UserRole.FARMER;
            case BUYER -> UserRole.BUYER;
            case TRANSPORTER -> UserRole.TRANSPORTER;
        };
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        return phone.trim();
    }

    public static class RegistrationConflictException extends RuntimeException {

        public RegistrationConflictException(String message) {
            super(message);
        }
    }
}