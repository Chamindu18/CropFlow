package com.cropflow.common.exception;

import com.cropflow.common.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.cropflow.auth.passwordreset.PasswordResetService;
import com.cropflow.auth.refresh.RefreshTokenService;
import com.cropflow.auth.service.AuthService.RegistrationConflictException;
import com.cropflow.auth.verification.EmailVerificationService;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authorization.AuthorizationDeniedException;

import org.springframework.http.converter.HttpMessageNotReadableException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleApplicationException(
            ApplicationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                exception.getStatus(),
                exception.getCode(),
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
                AuthenticationException exception,
                HttpServletRequest request
        ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Invalid email or password.",
                request.getRequestURI(),
                Map.of()
        );
        }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> details = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        details.putIfAbsent(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Request validation failed",
                request.getRequestURI(),
                details
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolationException(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Request validation failed",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred.",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(RegistrationConflictException.class)
        public ResponseEntity<ApiErrorResponse> handleRegistrationConflict(
                RegistrationConflictException exception,
                HttpServletRequest request
        ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "REGISTRATION_CONFLICT",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
        }

     @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(
                HttpMessageNotReadableException exception,
                HttpServletRequest request
        ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "Request contains invalid or malformed data.",
                request.getRequestURI(),
                Map.of()
        );
        }   

        @ExceptionHandler(EmailVerificationService.EmailVerificationException.class)
        public ResponseEntity<ApiErrorResponse> handleEmailVerificationException(
                EmailVerificationService.EmailVerificationException exception,
                HttpServletRequest request
        ) {
        HttpStatus status = switch (exception.getCode()) {
                case "VERIFICATION_TOKEN_USED",
                "VERIFICATION_TOKEN_EXPIRED",
                "INVALID_ACCOUNT_STATE" -> HttpStatus.CONFLICT;

                default -> HttpStatus.BAD_REQUEST;
        };

        return buildResponse(
                status,
                exception.getCode(),
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
        }

        @ExceptionHandler(
                RefreshTokenService.RefreshTokenException.class
        )
        public ResponseEntity<ApiErrorResponse> handleRefreshTokenException(
                RefreshTokenService.RefreshTokenException exception,
                HttpServletRequest request
        ) {
        HttpStatus status = switch (exception.getCode()) {
                case "REFRESH_TOKEN_REVOKED",
                "REFRESH_TOKEN_EXPIRED" -> HttpStatus.UNAUTHORIZED;

                default -> HttpStatus.UNAUTHORIZED;
        };

        return buildResponse(
                status,
                exception.getCode(),
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
        }

        @ExceptionHandler(
                PasswordResetService.PasswordResetException.class
        )
        public ResponseEntity<ApiErrorResponse> handlePasswordResetException(
                PasswordResetService.PasswordResetException exception,
                HttpServletRequest request
        ) {
        HttpStatus status = switch (exception.getCode()) {
                case "PASSWORD_RESET_TOKEN_EXPIRED",
                "PASSWORD_RESET_TOKEN_USED",
                "INVALID_ACCOUNT_STATE" -> HttpStatus.CONFLICT;

                default -> HttpStatus.BAD_REQUEST;
        };

        return buildResponse(
                status,
                exception.getCode(),
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
        }

        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ApiErrorResponse> handleResponseStatusException(
                ResponseStatusException exception,
                HttpServletRequest request
        ) {
        HttpStatus status =
                HttpStatus.valueOf(exception.getStatusCode().value());

        String message =
                exception.getReason() != null
                        ? exception.getReason()
                        : status.getReasonPhrase();

        return buildResponse(
                status,
                status == HttpStatus.NOT_FOUND
                        ? "RESOURCE_NOT_FOUND"
                        : "REQUEST_ERROR",
                message,
                request.getRequestURI(),
                Map.of()
        );
        }

        @ExceptionHandler(AuthorizationDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAuthorizationDeniedException(
                AuthorizationDeniedException exception,
                HttpServletRequest request
        ) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                "You do not have permission to access this resource.",
                request.getRequestURI(),
                Map.of()
        );
        }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String code,
            String message,
            String path,
            Map<String, String> details
    ) {
        ApiErrorResponse response = new ApiErrorResponse(
                Instant.now(),
                status.value(),
                code,
                message,
                path,
                details
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}