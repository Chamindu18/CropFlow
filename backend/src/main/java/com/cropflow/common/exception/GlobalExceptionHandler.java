package com.cropflow.common.exception;

import com.cropflow.common.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.cropflow.auth.service.AuthService.RegistrationConflictException;
import com.cropflow.auth.verification.EmailVerificationService;

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