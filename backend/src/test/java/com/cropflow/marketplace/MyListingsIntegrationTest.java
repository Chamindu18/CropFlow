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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MyListingsIntegrationTest {

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

    private User farmerOne;
    private User farmerTwo;
    private Listing farmerOneDraftListing;
    private Listing farmerOneActiveListing;
    private Listing farmerOneSoldListing;
    private Listing farmerOneCancelledListing;
    private Listing farmerTwoListing;

    @BeforeEach
    void setUp() {
        listingRepository.deleteAll();
        userRepository.deleteAll();

        this.farmerOne = createUser(
                UserRole.FARMER,
                "farmer.one@example.com"
        );

        this.farmerTwo = createUser(
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

        // Create listings in different states owned by farmerOne
        farmerOneDraftListing = listingRepository.save(
                new Listing(farmerOne, "Draft Tomatoes", "Fresh draft tomatoes")
        );

        farmerOneActiveListing = listingRepository.save(
                new Listing(farmerOne, "Active Carrots", "Fresh active carrots")
        );
        farmerOneActiveListing.activate();
        farmerOneActiveListing = listingRepository.save(farmerOneActiveListing);

        farmerOneSoldListing = listingRepository.save(
                new Listing(farmerOne, "Sold Potatoes", "Sold potatoes")
        );
        farmerOneSoldListing.activate();
        farmerOneSoldListing.markSold();
        farmerOneSoldListing = listingRepository.save(farmerOneSoldListing);

        farmerOneCancelledListing = listingRepository.save(
                new Listing(farmerOne, "Cancelled Onions", "Cancelled onions")
        );
        farmerOneCancelledListing.cancel();
        farmerOneCancelledListing = listingRepository.save(farmerOneCancelledListing);

        // Create listing owned by farmerTwo
        farmerTwoListing = listingRepository.save(
                new Listing(farmerTwo, "Other Farmer's Listing", "Should not appear in farmerOne's results")
        );
    }

    // ==================== AUTHORIZATION TESTS ====================

    @Test
    void unauthenticatedUserShouldReceive401() throws Exception {
        mockMvc.perform(
                get("/api/v1/marketplace/listings/mine")
        )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void farmerShouldAccessOwnListings() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", is(4)))
                .andExpect(jsonPath("$.content[*].sellerId", everyItem(is(farmerOne.getId().toString()))));
    }

    @Test
    void buyerShouldReceive403() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.BUYER)
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void transporterShouldReceive403() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.TRANSPORTER)
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void adminShouldReceive403() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        users.get(UserRole.ADMIN)
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isForbidden());
    }

    // ==================== OWNERSHIP TESTS ====================

    @Test
    void farmerReceivesOnlyOwnListings() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(4)))
                .andExpect(jsonPath("$.content[*].sellerId", everyItem(is(farmerOne.getId().toString()))));
    }

    @Test
    void anotherFarmersListingsAreNotIncluded() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", not(hasItem("Other Farmer's Listing"))));
    }

    @Test
    void sellerIdInEveryReturnedItemMatchesAuthenticatedFarmer() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        String farmerId = farmerOne.getId().toString();

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].sellerId", everyItem(is(farmerId))));
    }

    // ==================== STATUS TESTS ====================

    @Test
    void draftListingsAreReturned() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].status", hasItem("DRAFT")))
                .andExpect(jsonPath("$.content[*].title", hasItem("Draft Tomatoes")));
    }

    @Test
    void activeListingsAreReturned() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].status", hasItem("ACTIVE")))
                .andExpect(jsonPath("$.content[*].title", hasItem("Active Carrots")));
    }

    @Test
    void soldListingsAreReturned() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].status", hasItem("SOLD")))
                .andExpect(jsonPath("$.content[*].title", hasItem("Sold Potatoes")));
    }

    @Test
    void cancelledListingsAreReturned() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].status", hasItem("CANCELLED")))
                .andExpect(jsonPath("$.content[*].title", hasItem("Cancelled Onions")));
    }

    // ==================== PAGINATION TESTS ====================

    @Test
    void defaultPageIsZero() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number", is(0)));
    }

    @Test
    void defaultSizeIsTwenty() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(20)));
    }

    @Test
    void explicitPageAndSizeWorks() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?page=0&size=2")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number", is(0)))
                .andExpect(jsonPath("$.size", is(2)));
    }

    @Test
    void sizeFiftyWorks() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?size=50")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(50)));
    }

    @Test
    void sizeGreaterThanFiftyReturns400() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?size=51")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void sizeZeroReturns400() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?size=0")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void negativeSizeReturns400() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?size=-1")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void negativePageReturns400() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?page=-1")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isBadRequest());
    }

    // ==================== ORDERING TESTS ====================

    @Test
    void listingsAreNewestFirstByCreatedAtDesc() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title", is("Cancelled Onions")))
                .andExpect(jsonPath("$.content[1].title", is("Sold Potatoes")))
                .andExpect(jsonPath("$.content[2].title", is("Active Carrots")))
                .andExpect(jsonPath("$.content[3].title", is("Draft Tomatoes")));
    }

    // ==================== EMPTY DATA TEST ====================

    @Test
    void farmerWithNoListingsGetsEmptyPage() throws Exception {
        // Create a new farmer with no listings
        User emptyFarmer = createUser(
                UserRole.FARMER,
                "empty.farmer@example.com"
        );

        String token =
                jwtService.generateAccessToken(emptyFarmer);

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", is(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    // ==================== SECURITY TESTS ====================

    @Test
    void clientCannotChooseAnotherSellerViaQueryParameter() throws Exception {
        // Even if someone tries to add a sellerId parameter, it should be ignored
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        String otherFarmerId = farmerOne.getId().toString();

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine?sellerId=" + otherFarmerId)
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].sellerId", everyItem(is(farmerOne.getId().toString()))));
    }

    @Test
    void endpointDoesNotExposeAnotherFarmersListings() throws Exception {
        String token =
                jwtService.generateAccessToken(
                        farmerOne
                );

        mockMvc.perform(
                        get("/api/v1/marketplace/listings/mine")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", not(hasItem("Other Farmer's Listing"))));
    }

    @Test
    void publicBrowseEndpointBehaviorRemainsUnchanged() throws Exception {
        // Public browse should still only return ACTIVE listings
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(1))) // Only farmerOneActiveListing is ACTIVE
                .andExpect(jsonPath("$.content[*].status", everyItem(is("ACTIVE"))));
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