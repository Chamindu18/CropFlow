package com.cropflow.auth.verification;

import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class EmailVerificationService {

    private static final Duration TOKEN_LIFETIME = Duration.ofHours(24);

    private final SecureRandom secureRandom;
    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;

    public EmailVerificationService(
            EmailVerificationTokenRepository tokenRepository,
            UserRepository userRepository
    ) {
        this.secureRandom = new SecureRandom();
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String createVerificationToken(User user) {
        tokenRepository.deleteByUserId(user.getId());

        String rawToken = generateRawToken();
        String tokenHash = hashToken(rawToken);

        EmailVerificationToken token = new EmailVerificationToken(
                user,
                tokenHash,
                Instant.now().plus(TOKEN_LIFETIME)
        );

        tokenRepository.save(token);

        return rawToken;
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new EmailVerificationException(
                    "INVALID_VERIFICATION_TOKEN",
                    "The verification token is invalid."
            );
        }

        String tokenHash = hashToken(rawToken.trim());

        EmailVerificationToken token = tokenRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new EmailVerificationException(
                        "INVALID_VERIFICATION_TOKEN",
                        "The verification token is invalid."
                ));

        if (token.isUsed()) {
            throw new EmailVerificationException(
                    "VERIFICATION_TOKEN_USED",
                    "The verification token has already been used."
            );
        }

        if (token.isExpired()) {
            throw new EmailVerificationException(
                    "VERIFICATION_TOKEN_EXPIRED",
                    "The verification token has expired."
            );
        }

        User user = token.getUser();

        if (user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new EmailVerificationException(
                    "INVALID_ACCOUNT_STATE",
                    "The account cannot be verified in its current state."
            );
        }

        user.markEmailVerified();
        token.markUsed();

        userRepository.save(user);
        tokenRepository.save(token);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder result = new StringBuilder(hash.length * 2);

            for (byte value : hash) {
                result.append(String.format("%02x", value));
            }

            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception
            );
        }
    }

    public static class EmailVerificationException extends RuntimeException {

        private final String code;

        public EmailVerificationException(
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