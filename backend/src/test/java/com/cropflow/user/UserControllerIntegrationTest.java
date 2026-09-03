package com.cropflow.user;

import com.cropflow.security.PasswordService;
import com.cropflow.security.jwt.JwtService;
import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserRole;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.cropflow.marketplace.repository.ListingRepository;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ListingRepository listingRepository;

    private User activeUser;

    @BeforeEach
    void setUp() {
        listingRepository.deleteAll();
        userRepository.deleteAll();

        activeUser = new User(
                "farmer@example.com",
                passwordService.hash("StrongPassword123!"),
                "Kasun",
                "Perera",
                "+94771234567",
                UserRole.FARMER,
                UserStatus.PENDING_VERIFICATION
        );

        activeUser.markEmailVerified();

        activeUser = userRepository.save(activeUser);
    }

    @Test
    void currentUserShouldBeReturnedForValidJwt() throws Exception {
        String token = jwtService.generateAccessToken(activeUser);

        mockMvc.perform(
                        get("/api/v1/users/me")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId",
                        is(activeUser.getId().toString())))
                .andExpect(jsonPath("$.email",
                        is("farmer@example.com")))
                .andExpect(jsonPath("$.firstName",
                        is("Kasun")))
                .andExpect(jsonPath("$.role",
                        is("FARMER")))
                .andExpect(jsonPath("$.status",
                        is("ACTIVE")))
                .andExpect(jsonPath("$.emailVerified",
                        is(true)));
    }

    @Test
    void currentUserShouldRejectRequestWithoutJwt() throws Exception {
        mockMvc.perform(
                        get("/api/v1/users/me")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code",
                        is("UNAUTHORIZED")));
    }

    @Test
    void currentUserShouldRejectTamperedJwt() throws Exception {
        String token = jwtService.generateAccessToken(activeUser);

        String tamperedToken =
                token.substring(0, token.length() - 1)
                        + (token.endsWith("a") ? "b" : "a");

        mockMvc.perform(
                        get("/api/v1/users/me")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + tamperedToken
                                )
                )
                .andExpect(status().isUnauthorized());
    }
}