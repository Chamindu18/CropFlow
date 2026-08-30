package com.cropflow.auth;

import com.cropflow.security.PasswordService;
import com.cropflow.security.RefreshTokenCookie;
import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserRole;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Objects;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RefreshTokenIntegrationTest {

    private static final String EMAIL = "refresh@example.com";
    private static final String PASSWORD = "StrongPassword123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User user = new User(
                EMAIL,
                passwordService.hash(PASSWORD),
                "Refresh",
                "Tester",
                "+94771234567",
                UserRole.FARMER,
                UserStatus.PENDING_VERIFICATION
        );

        user.markEmailVerified();

        userRepository.save(user);
    }

    @Test
    void loginShouldReturnAccessTokenAndSetRefreshCookie()
            throws Exception {

        MvcResult result = mockMvc.perform(
                        post("/api/v1/auth/login")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "refresh@example.com",
                                          "password": "StrongPassword123!"
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.role").value("FARMER"))
                .andReturn();

        Cookie refreshCookie =
                extractRefreshCookie(result);

        assertNotNull(refreshCookie);
        assertEquals(
                RefreshTokenCookie.NAME,
                refreshCookie.getName()
        );
        assertNotNull(refreshCookie.getValue());
        assertFalse(refreshCookie.getValue().isBlank());

        assertTrue(
                result.getResponse()
                        .getHeader(HttpHeaders.SET_COOKIE)
                        .contains("HttpOnly")
        );

        assertTrue(
                result.getResponse()
                        .getHeader(HttpHeaders.SET_COOKIE)
                        .contains("SameSite=Lax")
        );

        String responseBody =
                result.getResponse().getContentAsString();

        assertFalse(
                responseBody.contains(refreshCookie.getValue())
        );
    }

    @Test
    void refreshShouldRotateRefreshToken()
            throws Exception {

        MvcResult loginResult = login();

        Cookie firstRefreshCookie =
                extractRefreshCookie(loginResult);

        assertNotNull(firstRefreshCookie);

        MvcResult refreshResult = mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .with(csrf())
                                .cookie(firstRefreshCookie)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn();

        Cookie secondRefreshCookie =
                extractRefreshCookie(refreshResult);

        assertNotNull(secondRefreshCookie);

        assertNotEquals(
                firstRefreshCookie.getValue(),
                secondRefreshCookie.getValue()
        );

        assertTrue(
                refreshResult.getResponse()
                        .getContentAsString()
                        .contains("\"accessToken\"")
        );

        assertFalse(
                refreshResult.getResponse()
                        .getContentAsString()
                        .contains(secondRefreshCookie.getValue())
        );
    }

    @Test
    void oldRefreshTokenShouldBeRejectedAfterRotation()
            throws Exception {

        MvcResult loginResult = login();

        Cookie firstRefreshCookie =
                extractRefreshCookie(loginResult);

        assertNotNull(firstRefreshCookie);

        mockMvc.perform(
                post("/api/v1/auth/refresh")
                        .with(csrf())
                        .cookie(firstRefreshCookie)
        )
                .andExpect(status().isOk());

        mockMvc.perform(
                post("/api/v1/auth/refresh")
                        .with(csrf())
                        .cookie(firstRefreshCookie)
        )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutShouldRevokeRefreshTokenAndClearCookie()
            throws Exception {

        MvcResult loginResult = login();

        Cookie refreshCookie =
                extractRefreshCookie(loginResult);

        assertNotNull(refreshCookie);

        mockMvc.perform(
                post("/api/v1/auth/logout")
                        .with(csrf())
                        .cookie(refreshCookie)
        )
                .andExpect(status().isNoContent())
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        containsString("Max-Age=0")
                ));

        mockMvc.perform(
                post("/api/v1/auth/refresh")
                        .with(csrf())
                        .cookie(refreshCookie)
        )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshWithoutCookieShouldBeRejected()
            throws Exception {

        mockMvc.perform(
                post("/api/v1/auth/refresh")
                        .with(csrf())
        )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutWithoutCookieShouldStillClearSessionCookie()
            throws Exception {

        mockMvc.perform(
                post("/api/v1/auth/logout")
                        .with(csrf())
        )
                .andExpect(status().isNoContent())
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        containsString("Max-Age=0")
                ));
    }

    private MvcResult login() throws Exception {
        return mockMvc.perform(
                        post("/api/v1/auth/login")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "refresh@example.com",
                                          "password": "StrongPassword123!"
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andReturn();
    }

    private Cookie extractRefreshCookie(
            MvcResult result
    ) {
        Cookie[] cookies =
                result.getResponse().getCookies();

        return Arrays.stream(cookies)
                .filter(Objects::nonNull)
                .filter(cookie ->
                        RefreshTokenCookie.NAME.equals(
                                cookie.getName()
                        )
                )
                .findFirst()
                .orElse(null);
    }
}