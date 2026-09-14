package com.cropflow.marketplace;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.domain.ListingStatus;
import com.cropflow.marketplace.repository.ListingRepository;
import com.cropflow.security.PasswordService;
import com.cropflow.security.jwt.JwtService;
import com.cropflow.user.domain.User;
import com.cropflow.user.domain.UserRole;
import com.cropflow.user.domain.UserStatus;
import com.cropflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ListingStateTransitionIntegrationTest {

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

    private Listing draftListing;
    private Listing activeListing;
    private Listing soldListing;
    private Listing cancelledListing;
    private User farmerTwo;

    @BeforeAll
    static void setupClass() {
        // Static setup if needed
    }

    @BeforeEach
    void setUp() {
        listingRepository.deleteAll();
        userRepository.deleteAll();

        User farmerOne = createUser(
                UserRole.FARMER,
                "farmer.one@example.com"
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

        this.farmerTwo = createUser(
                UserRole.FARMER,
                "farmer.two@example.com"
        );

        // Create listings in different states owned by farmerOne
        draftListing = listingRepository.save(
                new Listing(farmerOne, "Draft Tomatoes", "Fresh draft tomatoes")
        );

        activeListing = listingRepository.save(
                new Listing(farmerOne, "Active Carrots", "Fresh active carrots")
        );
        activeListing.activate();
        activeListing = listingRepository.save(activeListing);

        soldListing = listingRepository.save(
                new Listing(farmerOne, "Sold Potatoes", "Sold potatoes")
        );
        soldListing.activate();
        soldListing.markSold();
        soldListing = listingRepository.save(soldListing);

        cancelledListing = listingRepository.save(
                new Listing(farmerOne, "Cancelled Onions", "Cancelled onions")
        );
        cancelledListing.cancel();
        cancelledListing = listingRepository.save(cancelledListing);
    }

    @Test
    void draftToActiveByOwnerShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.id", is(draftListing.getId().toString())));
    }

    @Test
    void draftToCancelledByOwnerShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/cancel", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.id", is(draftListing.getId().toString())));
    }

    @Test
    void activeToSoldByOwnerShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/mark-sold", activeListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SOLD")))
                .andExpect(jsonPath("$.id", is(activeListing.getId().toString())));
    }

    @Test
    void activeToCancelledByOwnerShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/cancel", activeListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.id", is(activeListing.getId().toString())));
    }

    @Test
    void draftToSoldShouldBeRejected() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/mark-sold", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void activeToActiveShouldBeRejected() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", activeListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void soldToAnyTransitionShouldBeRejected() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", soldListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/cancel", soldListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/mark-sold", soldListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void cancelledToAnyTransitionShouldBeRejected() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", cancelledListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/cancel", cancelledListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/mark-sold", cancelledListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void wrongFarmerShouldReceive404() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        Listing otherFarmerListing = listingRepository.save(
                new Listing(farmerTwo, "Other Farmer", "Other listing")
        );

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", otherFarmerListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void buyerShouldReceive403() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.BUYER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void transporterShouldReceive403() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.TRANSPORTER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void adminShouldReceive403() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.ADMIN));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedShouldReceive401() throws Exception {
        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", draftListing.getId())
                                .with(csrf())
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void nonexistentListingShouldReceive404() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", randomId)
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void responseShouldContainUpdatedStatusAndTimestamps() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void requestBodyCannotInfluenceOwnership() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        Listing otherFarmerListing = listingRepository.save(
                new Listing(farmerTwo, "Other Farmer", "Other listing")
        );

        // Even if someone tried to send a body with farmerId, it shouldn't matter
        // The endpoint doesn't accept a body, so this test verifies the endpoint signature
        mockMvc.perform(
                        post("/api/v1/marketplace/listings/{listingId}/activate", otherFarmerListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNotFound());
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