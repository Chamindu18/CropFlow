package com.cropflow.auth.refresh;

import com.cropflow.security.jwt.JwtProperties;
import com.cropflow.user.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class RefreshTokenService {

    private final SecureRandom secureRandom = new SecureRandom();
    private final RefreshTokenRepository repository;
    private final JwtProperties jwtProperties;

    public RefreshTokenService(
            RefreshTokenRepository repository,
            JwtProperties jwtProperties
    ) {
        this.repository = repository;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public IssuedRefreshToken create(User user) {
        String rawToken = generateToken();

        RefreshToken entity = new RefreshToken(
                user,
                hash(rawToken),
                Instant.now().plus(
                        jwtProperties.refreshTokenTtl()
                )
        );

        RefreshToken saved = repository.save(entity);

        return new IssuedRefreshToken(
                saved,
                rawToken
        );
    }

    @Transactional
    public RotationResult rotate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidToken();
        }

        RefreshToken current = repository
                .findByTokenHash(hash(rawToken))
                .orElseThrow(this::invalidToken);

        if (current.isRevoked()) {
            throw new RefreshTokenException(
                    "REFRESH_TOKEN_REVOKED",
                    "Refresh token is no longer valid."
            );
        }

        if (current.isExpired()) {
            throw new RefreshTokenException(
                    "REFRESH_TOKEN_EXPIRED",
                    "Refresh token has expired."
            );
        }

        String replacementRawToken = generateToken();

        RefreshToken replacement = new RefreshToken(
                current.getUser(),
                hash(replacementRawToken),
                Instant.now().plus(
                        jwtProperties.refreshTokenTtl()
                )
        );

        RefreshToken savedReplacement =
                repository.save(replacement);

        current.replaceWith(savedReplacement);
        repository.save(current);

        return new RotationResult(
                current.getUser(),
                replacementRawToken
        );
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        repository.findByTokenHash(hash(rawToken))
                .ifPresent(token -> {
                    if (!token.isRevoked()) {
                        token.revoke();
                        repository.save(token);
                    }
                });
    }

    private RefreshTokenException invalidToken() {
        return new RefreshTokenException(
                "INVALID_REFRESH_TOKEN",
                "Refresh token is invalid."
        );
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder builder = new StringBuilder(64);

            for (byte value : digest) {
                builder.append(
                        String.format("%02x", value)
                );
            }

            return builder.toString();

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception
            );
        }
    }

    public record IssuedRefreshToken(
            RefreshToken entity,
            String rawToken
    ) {
    }

    public record RotationResult(
            User user,
            String refreshToken
    ) {
    }

    public static class RefreshTokenException
            extends RuntimeException {

        private final String code;

        public RefreshTokenException(
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