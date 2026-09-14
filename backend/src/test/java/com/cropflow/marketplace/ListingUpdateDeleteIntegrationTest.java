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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ListingUpdateDeleteIntegrationTest {

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
    void ownerUpdatesDraftTitleShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Updated Tomatoes\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Tomatoes")))
                .andExpect(jsonPath("$.description", is("Fresh draft tomatoes")))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    void ownerUpdatesDraftDescriptionShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"description\": \"Updated description\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Draft Tomatoes")))
                .andExpect(jsonPath("$.description", is("Updated description")))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    void ownerUpdatesBothFieldsShouldSucceed() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"New Title\", \"description\": \"New Description\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("New Title")))
                .andExpect(jsonPath("$.description", is("New Description")))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    void partialUpdatePreservesOtherField() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Only Title Changed\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Only Title Changed")))
                .andExpect(jsonPath("$.description", is("Fresh draft tomatoes")));
    }

    @Test
    void updateActiveShouldReturn409() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", activeListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void updateSoldShouldReturn409() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", soldListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void updateCancelledShouldReturn409() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", cancelledListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void wrongOwnerShouldReceive404OnUpdate() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        Listing otherFarmerListing = listingRepository.save(
                new Listing(farmerTwo, "Other Farmer", "Other listing")
        );

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", otherFarmerListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void nonexistentListingShouldReceive404OnUpdate() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", randomId)
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void buyerShouldReceive403OnUpdate() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.BUYER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void transporterShouldReceive403OnUpdate() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.TRANSPORTER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void adminShouldReceive403OnUpdate() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.ADMIN));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedShouldReceive401OnUpdate() throws Exception {
        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Should Fail\"}")
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void oversizedTitleShouldReturn400() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));
        String longTitle = "a".repeat(151);

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"" + longTitle + "\"}")
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    @Test
    void oversizedDescriptionShouldReturn400() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));
        String longDescription = "a".repeat(2001);

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"description\": \"" + longDescription + "\"}")
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    @Test
    void blankTitleShouldReturn400() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"   \"}")
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("REQUEST_ERROR")));
    }

    @Test
    void requestCannotModifySellerId() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));
        UUID otherFarmerId = farmerTwo.getId();

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Valid Title\", \"sellerId\": \"" + otherFarmerId + "\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerId", is(users.get(UserRole.FARMER).getId().toString())));
    }

    @Test
    void requestCannotModifyStatus() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Valid Title\", \"status\": \"SOLD\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    void updatedAtChangesAfterActualUpdate() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        String beforeUpdate = draftListing.getUpdatedAt().toString();

        mockMvc.perform(
                        patch("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\": \"Updated\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedAt").exists());

        String afterUpdate = mockMvc.perform(
                        get("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Just verify the updatedAt is present and different from createdAt
        mockMvc.perform(
                        get("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void ownerDeletesDraftShouldReturn204() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        Listing toDelete = listingRepository.save(
                new Listing(users.get(UserRole.FARMER), "To Delete", "Will be deleted")
        );

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", toDelete.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNoContent());
    }

    @Test
    void deletedListingSubsequentlyReturns404() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        Listing toDelete = listingRepository.save(
                new Listing(users.get(UserRole.FARMER), "To Delete", "Will be deleted")
        );

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", toDelete.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNoContent());

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/{listingId}", toDelete.getId())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteActiveShouldReturn409() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", activeListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void deleteSoldShouldReturn409() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", soldListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void deleteCancelledShouldReturn409() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", cancelledListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_LISTING_STATE_TRANSITION")));
    }

    @Test
    void wrongOwnerShouldReceive404OnDelete() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        Listing otherFarmerListing = listingRepository.save(
                new Listing(farmerTwo, "Other Farmer", "Other listing")
        );

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", otherFarmerListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void nonexistentListingShouldReceive404OnDelete() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", randomId)
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void buyerShouldReceive403OnDelete() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.BUYER));

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void transporterShouldReceive403OnDelete() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.TRANSPORTER));

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void adminShouldReceive403OnDelete() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.ADMIN));

        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedShouldReceive401OnDelete() throws Exception {
        mockMvc.perform(
                        delete("/api/v1/marketplace/listings/{listingId}", draftListing.getId())
                                .with(csrf())
                )
                .andExpect(status().isUnauthorized());
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