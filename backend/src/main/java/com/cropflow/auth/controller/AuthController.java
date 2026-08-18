package com.cropflow.auth.controller;

import com.cropflow.auth.dto.EmailVerificationResponse;
import com.cropflow.auth.dto.LoginRequest;
import com.cropflow.auth.dto.LoginResponse;
import com.cropflow.auth.dto.RegistrationRequest;
import com.cropflow.auth.dto.RegistrationResponse;
import com.cropflow.auth.refresh.RefreshTokenService;
import com.cropflow.auth.service.AuthService;
import com.cropflow.auth.verification.EmailVerificationService;
import com.cropflow.security.RefreshCookieProperties;
import com.cropflow.security.RefreshTokenCookie;
import com.cropflow.security.jwt.JwtProperties;
import com.cropflow.security.jwt.JwtService;
import com.cropflow.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshCookieProperties refreshCookieProperties;
    private final JwtProperties jwtProperties;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            RefreshTokenService refreshTokenService,
            RefreshCookieProperties refreshCookieProperties,
            JwtProperties jwtProperties,
            JwtService jwtService
    ) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.refreshTokenService = refreshTokenService;
        this.refreshCookieProperties = refreshCookieProperties;
        this.jwtProperties = jwtProperties;
        this.jwtService = jwtService;
    }

    /**
     * Authenticates a verified user and issues:
     * - a short-lived access JWT in the response body
     * - a long-lived refresh token in an HttpOnly cookie
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthService.AuthenticationResult result =
                authService.login(request);

        RefreshTokenCookie.add(
                response,
                result.refreshToken(),
                jwtProperties.refreshTokenTtl(),
                refreshCookieProperties.secure()
        );

        return ResponseEntity.ok(result.response());
    }

    /**
     * Creates a new unverified CropFlow account.
     */
    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(
            @Valid @RequestBody RegistrationRequest request
    ) {
        RegistrationResponse registrationResponse =
                authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(registrationResponse);
    }

    /**
     * Rotates the refresh token and issues a new access JWT.
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefreshToken =
                RefreshTokenCookie.extract(request)
                        .orElseThrow(() ->
                                new RefreshTokenService.RefreshTokenException(
                                        "INVALID_REFRESH_TOKEN",
                                        "Refresh token is invalid."
                                )
                        );

        RefreshTokenService.RotationResult result =
                refreshTokenService.rotate(rawRefreshToken);

        User user = result.user();

        String accessToken =
                jwtService.generateAccessToken(user);

        Instant expiresAt =
                Instant.now()
                        .plus(jwtProperties.accessTokenTtl());

        RefreshTokenCookie.add(
                response,
                result.refreshToken(),
                jwtProperties.refreshTokenTtl(),
                refreshCookieProperties.secure()
        );

        LoginResponse loginResponse = new LoginResponse(
                accessToken,
                "Bearer",
                expiresAt,
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return ResponseEntity.ok(loginResponse);
    }

    /**
     * Revokes the current refresh token and clears the browser cookie.
     *
     * Logout is intentionally idempotent: absence of a refresh token
     * still results in a successful cookie clear.
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        RefreshTokenCookie.extract(request)
                .ifPresent(refreshTokenService::revoke);

        RefreshTokenCookie.clear(
                response,
                refreshCookieProperties.secure()
        );
    }

    /**
     * Verifies the one-time email verification token.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<EmailVerificationResponse> verifyEmail(
            @RequestParam String token
    ) {
        emailVerificationService.verifyEmail(token);

        return ResponseEntity.ok(
                new EmailVerificationResponse(
                        "Email verification successful."
                )
        );
    }
}