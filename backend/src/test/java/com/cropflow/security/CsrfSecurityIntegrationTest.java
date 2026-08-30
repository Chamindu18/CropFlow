package com.cropflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CsrfSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginWithoutCsrfTokenShouldBeRejected() throws Exception {
        mockMvc.perform(
                post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com",
                                  "password": "StrongPassword123!"
                                }
                                """)
        )
                .andExpect(status().isForbidden());
    }

    @Test
    void loginWithCsrfTokenShouldPassCsrfValidation()
            throws Exception {

        var result = mockMvc.perform(
                        post("/api/v1/auth/login")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "test@example.com",
                                          "password": "StrongPassword123!"
                                        }
                                        """)
                )
                .andReturn();

        /*
         * The request should pass the CSRF layer.
         *
         * Authentication may fail because this test does not create
         * a valid user. Therefore we only assert that Spring Security
         * did not reject it with 403 due to CSRF.
         */
        assertNotEquals(
                403,
                result.getResponse().getStatus()
        );
    }

    @Test
        void csrfEndpointShouldReturnToken() throws Exception {
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/security/csrf")
        )
                .andExpect(status().isOk())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.token")
                                .isNotEmpty()
                );
        }
}