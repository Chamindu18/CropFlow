package com.cropflow.marketplace;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.repository.ListingRepository;
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
import org.springframework.test.web.servlet.MockMvc;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ListingAuthorizationIntegrationTest {

    private static final String PASSWORD = "StrongPassword123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private JwtService jwtService;

    private final Map<UserRole, User> users =
            new EnumMap<>(UserRole.class);

    private Listing farmerOneListing;
    private Listing farmerTwoListing;

    @BeforeEach
    void setUp() {
        listingRepository.deleteAll();
        userRepository.deleteAll();

        User farmerOne = createUser(
                UserRole.FARMER,
                "farmer.one@example.com"
        );

        User farmerTwo = createUser(
                UserRole.FARMER,
                "farmer.two@example.com"
        );

        User buyer = createUser(
                UserRole.BUYER,
                "buyer@example.com"
        );

        User transporter = createUser(
                UserRole.TRANSPORTER,
                "transporter@example.com"
        );

        User admin = createUser(
                UserRole.ADMIN,
                "admin@example.com"
        );

        users.put(UserRole.FARMER, farmerOne);
        users.put(UserRole.BUYER, buyer);
        users.put(UserRole.TRANSPORTER, transporter);
        users.put(UserRole.ADMIN, admin);

        farmerOneListing = listingRepository.save(
                new Listing(
                        farmerOne,
                        "Tomatoes",
                        "Fresh farm tomatoes"
                )
        );

        farmerTwoListing = listingRepository.save(
                new Listing(
                        farmerTwo,
                        "Carrots",
                        "Fresh farm carrots"
                )
        );
    }

    @Test
    void unauthenticatedUserShouldReceive401() throws Exception {
        mockMvc.perform(
                get("/api/v1/marketplace/listings/{listingId}",
                        farmerOneListing.getId())
        )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void farmerShouldAccessOwnListing() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.FARMER)
                );

        mockMvc.perform(
                get("/api/v1/marketplace/listings/{listingId}",
                        farmerOneListing.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                "$.id",
                                is(farmerOneListing.getId().toString())
                        )
                )
                .andExpect(
                        jsonPath(
                                "$.sellerId",
                                is(users.get(UserRole.FARMER)
                                        .getId()
                                        .toString())
                        )
                )
                .andExpect(
                        jsonPath("$.title", is("Tomatoes"))
                );
    }

    @Test
    void farmerShouldNotAccessAnotherFarmersListing()
            throws Exception {

        User farmerOne =
                users.get(UserRole.FARMER);

        String token =
                jwtService.generateAccessToken(farmerOne);

        mockMvc.perform(
                get("/api/v1/marketplace/listings/{listingId}",
                        farmerTwoListing.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        )
                .andExpect(status().isNotFound());
    }

    @Test
    void buyerShouldNotAccessFarmerListing() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.BUYER)
                );

        mockMvc.perform(
                get("/api/v1/marketplace/listings/{listingId}",
                        farmerOneListing.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        )
                .andExpect(status().isForbidden());
    }

    @Test
    void transporterShouldNotAccessFarmerListing()
            throws Exception {

        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.TRANSPORTER)
                );

        mockMvc.perform(
                get("/api/v1/marketplace/listings/{listingId}",
                        farmerOneListing.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        )
                .andExpect(status().isForbidden());
    }

    @Test
    void adminShouldNotBypassFarmerOwnershipRule()
            throws Exception {

        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.ADMIN)
                );

        mockMvc.perform(
                get("/api/v1/marketplace/listings/{listingId}",
                        farmerOneListing.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        )
                .andExpect(status().isForbidden());
    }

    private User createUser(
            UserRole role,
            String email
    ) {
        User user = new User(
                email,
                passwordService.hash(PASSWORD),
                role.name(),
                "Tester",
                null,
                role,
                UserStatus.PENDING_VERIFICATION
        );

        user.markEmailVerified();

        return userRepository.save(user);
    }
}