package com.cropflow.auth.service;

import com.cropflow.auth.dto.LoginRequest;
import com.cropflow.auth.dto.LoginResponse;
import com.cropflow.auth.dto.RegistrationRequest;
import com.cropflow.auth.dto.RegistrationResponse;
import com.cropflow.auth.refresh.RefreshTokenService;
import com.cropflow.auth.verification.EmailVerificationService;
import com.cropflow.security.PasswordService;
import com.cropflow.security.jwt.JwtProperties;
import com.cropflow.security.jwt.JwtService;
import com.cropflow.security.principal.CropFlowUserPrincipal;
import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserRole;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final EmailVerificationService emailVerificationService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            JwtProperties jwtProperties,
            UserRepository userRepository,
            PasswordService passwordService,
            EmailVerificationService emailVerificationService,
                RefreshTokenService refreshTokenService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.emailVerificationService = emailVerificationService;
        this.refreshTokenService = refreshTokenService;
    }

    public record AuthenticationResult(
                LoginResponse response,
                String refreshToken
        ) {
        }

    /**
     * Authenticates a verified active user and creates a short-lived JWT.
     */
    @Transactional
        public AuthenticationResult login(LoginRequest request) {
        String normalizedEmail =
                normalizeEmail(request.email());

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                normalizedEmail,
                                request.password()
                        )
                );

        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user could not be loaded."
                        )
                );

        Instant expiresAt =
                Instant.now()
                        .plus(jwtProperties.accessTokenTtl());

        String accessToken =
                jwtService.generateAccessToken(user);

        RefreshTokenService.IssuedRefreshToken refreshToken =
                refreshTokenService.create(user);

        LoginResponse loginResponse = new LoginResponse(
                accessToken,
                "Bearer",
                expiresAt,
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return new AuthenticationResult(
                loginResponse,
                refreshToken.rawToken()
        );
        }
    /**
     * Creates a pending user and a one-time email verification token.
     */
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

        emailVerificationService.createVerificationToken(savedUser);

        return new RegistrationResponse(
                "Registration successful. Please verify your email.",
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getStatus()
        );
    }

    private UserRole mapRole(
            com.cropflow.auth.dto.RegistrationRole role
    ) {
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

    public static class RegistrationConflictException
            extends RuntimeException {

        public RegistrationConflictException(String message) {
            super(message);
        }
    }
}