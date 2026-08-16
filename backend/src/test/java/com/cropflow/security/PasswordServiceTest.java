package com.cropflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class PasswordServiceTest {

    private final PasswordEncoder passwordEncoder =
            Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    private final PasswordService passwordService =
            new PasswordService(passwordEncoder);

    @Test
    void hashShouldProduceDifferentValueFromRawPassword() {
        String rawPassword = "StrongPassword123!";

        String hash = passwordService.hash(rawPassword);

        assertNotNull(hash);
        assertNotEquals(rawPassword, hash);
    }

    @Test
    void matchesShouldReturnFalseForIncorrectPassword() {
        String rawPassword = "StrongPassword123!";
        String incorrectPassword = "WrongPassword123!";

        String hash = passwordService.hash(rawPassword);

        assertTrue(passwordService.matches(rawPassword, hash));
        assertFalse(passwordService.matches(incorrectPassword, hash));
    }

    @Test
    void hashingSamePasswordTwiceShouldProduceDifferentHashes() {
        String rawPassword = "StrongPassword123!";

        String firstHash = passwordService.hash(rawPassword);
        String secondHash = passwordService.hash(rawPassword);

        assertNotEquals(firstHash, secondHash);

        assertTrue(passwordService.matches(rawPassword, firstHash));
        assertTrue(passwordService.matches(rawPassword, secondHash));
}
}