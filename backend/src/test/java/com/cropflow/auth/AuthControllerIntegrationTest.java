package com.cropflow.auth;

import com.cropflow.user.repository.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanDatabase() {
        userRepository.deleteAll();
    }

    @Test
    void registerShouldCreatePendingUserAndHashPassword() throws Exception {
        String request = """
                {
                  "email": "Farmer@Example.com",
                  "password": "StrongPassword123!",
                  "firstName": "Kasun",
                  "lastName": "Perera",
                  "phone": "+94771234567",
                  "role": "FARMER"
                }
                """;

        String response = mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(request)
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message",
                        is("Registration successful. Please verify your email.")))
                .andExpect(jsonPath("$.email",
                        is("farmer@example.com")))
                .andExpect(jsonPath("$.status",
                        is("PENDING_VERIFICATION")))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode responseBody = objectMapper.readTree(response);

        assertNotNull(responseBody.get("userId"));

        var user = userRepository.findByEmail("farmer@example.com")
                .orElseThrow();

        assertNotEquals(
                "StrongPassword123!",
                user.getPasswordHash()
        );
    }

    @Test
    void registerShouldRejectDuplicateEmail() throws Exception {
        String firstRequest = """
                {
                  "email": "farmer@example.com",
                  "password": "StrongPassword123!",
                  "firstName": "Kasun",
                  "lastName": "Perera",
                  "role": "FARMER"
                }
                """;

        String duplicateRequest = """
                {
                  "email": "FARMER@example.com",
                  "password": "AnotherPassword123!",
                  "firstName": "Nimal",
                  "lastName": "Silva",
                  "role": "BUYER"
                }
                """;

        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(firstRequest)
                )
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(duplicateRequest)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code",
                        is("REGISTRATION_CONFLICT")));
    }

    @Test
    void registerShouldRejectAdminRole() throws Exception {
        String request = """
                {
                  "email": "admin@example.com",
                  "password": "StrongPassword123!",
                  "firstName": "System",
                  "lastName": "Admin",
                  "role": "ADMIN"
                }
                """;

        mockMvc.perform(
                        post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(request)
                )
                .andExpect(status().isBadRequest());
    }
}