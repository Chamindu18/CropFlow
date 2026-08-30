package com.cropflow.auth.passwordreset;

import com.cropflow.auth.refresh.RefreshTokenRepository;
import com.cropflow.security.PasswordService;
import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class PasswordResetService {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom secureRandom = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final PasswordResetProperties properties;
    private final RefreshTokenRepository refreshTokenRepository;

    public PasswordResetService(
            PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            PasswordService passwordService,
            PasswordResetProperties properties,
            RefreshTokenRepository refreshTokenRepository
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.properties = properties;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Creates a password-reset token for an eligible account.
     *
     * The raw token is never persisted. Only its SHA-256 hash is stored.
     *
     * Returning null for an unknown/ineligible account is intentional;
     * the controller can return the same public response regardless of
     * whether the account exists.
     */
    @Transactional
    public String requestReset(String email) {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElse(null);

        if (user == null ||
                user.getStatus() != UserStatus.ACTIVE) {
            return null;
        }

        // Only one active reset token should exist for an account.
        tokenRepository.deleteByUserId(user.getId());

        String rawToken = generateToken();

        PasswordResetToken token = new PasswordResetToken(
                user,
                hash(rawToken),
                Instant.now().plus(
                        properties.passwordResetTokenTtl()
                )
        );

        tokenRepository.save(token);

        return rawToken;
    }

    /**
     * Validates a reset token and changes the user's password.
     *
     * The operation is transactional so the password update and token
     * consumption happen atomically.
     */
    @Transactional
    public void resetPassword(
            String rawToken,
            String newPassword
    ) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidToken();
        }

        PasswordResetToken token = tokenRepository
                .findByTokenHash(hash(rawToken.trim()))
                .orElseThrow(this::invalidToken);

        if (token.isUsed()) {
            throw new PasswordResetException(
                    "PASSWORD_RESET_TOKEN_USED",
                    "Password reset token has already been used."
            );
        }

        if (token.isExpired()) {
            throw new PasswordResetException(
                    "PASSWORD_RESET_TOKEN_EXPIRED",
                    "Password reset token has expired."
            );
        }

        User user = token.getUser();

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new PasswordResetException(
                    "INVALID_ACCOUNT_STATE",
                    "Password reset is not available for this account."
            );
        }

        String passwordHash =
                passwordService.hash(newPassword);

        user.changePassword(passwordHash);

        refreshTokenRepository.deleteByUserId(user.getId());

        token.markUsed();

        userRepository.save(user);
        tokenRepository.save(token);
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];

        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder result = new StringBuilder(64);

            for (byte value : digest) {
                result.append(
                        String.format("%02x", value)
                );
            }

            return result.toString();

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception
            );
        }
    }

    private PasswordResetException invalidToken() {
        return new PasswordResetException(
                "INVALID_PASSWORD_RESET_TOKEN",
                "Password reset token is invalid."
        );
    }

    public static class PasswordResetException
            extends RuntimeException {

        private final String code;

        public PasswordResetException(
                String code,
                String message
        ) {
            super(message);
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}