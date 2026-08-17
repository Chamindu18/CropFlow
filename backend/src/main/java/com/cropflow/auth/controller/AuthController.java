package com.cropflow.auth.controller;

import com.cropflow.auth.dto.EmailVerificationResponse;
import com.cropflow.auth.dto.RegistrationRequest;
import com.cropflow.auth.dto.RegistrationResponse;
import com.cropflow.auth.service.AuthService;
import com.cropflow.auth.verification.EmailVerificationService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(
            @Valid @RequestBody RegistrationRequest request
    ) {
        RegistrationResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

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