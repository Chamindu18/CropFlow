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

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ListingBrowseIntegrationTest {

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

    private Listing activeListing1;
    private Listing activeListing2;
    private Listing draftListing;
    private Listing soldListing;
    private Listing cancelledListing;

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

        // Create listings in different states
        activeListing1 = listingRepository.save(
                new Listing(farmerOne, "Fresh Tomatoes", "Red and juicy tomatoes")
        );
        activeListing1.activate();
        activeListing1 = listingRepository.save(activeListing1);

        activeListing2 = listingRepository.save(
                new Listing(farmerOne, "Organic Carrots", "Fresh organic carrots")
        );
        activeListing2.activate();
        activeListing2 = listingRepository.save(activeListing2);

        draftListing = listingRepository.save(
                new Listing(farmerOne, "Draft Potatoes", "Not ready yet")
        );

        soldListing = listingRepository.save(
                new Listing(farmerOne, "Sold Onions", "Already sold")
        );
        soldListing.activate();
        soldListing.markSold();
        soldListing = listingRepository.save(soldListing);

        cancelledListing = listingRepository.save(
                new Listing(farmerOne, "Cancelled Garlic", "Cancelled")
        );
        cancelledListing.cancel();
        cancelledListing = listingRepository.save(cancelledListing);
    }

    @Test
    void unauthenticatedUserCanBrowse() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", is(2)));
    }

    @Test
    void authenticatedFarmerCanBrowse() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.FARMER));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)));
    }

    @Test
    void authenticatedBuyerCanBrowse() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.BUYER));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)));
    }

    @Test
    void authenticatedTransporterCanBrowse() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.TRANSPORTER));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)));
    }

    @Test
    void authenticatedAdminCanBrowse() throws Exception {
        String token = jwtService.generateAccessToken(users.get(UserRole.ADMIN));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)));
    }

    @Test
    void onlyActiveListingsAppear() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("ACTIVE"))));
    }

    @Test
    void draftListingsExcluded() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", not(hasItem("Draft Potatoes"))));
    }

    @Test
    void soldListingsExcluded() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", not(hasItem("Sold Onions"))));
    }

    @Test
    void cancelledListingsExcluded() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", not(hasItem("Cancelled Garlic"))));
    }

    @Test
    void defaultPageIsZero() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number", is(0)));
    }

    @Test
    void defaultSizeIsTwenty() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(20)));
    }

    @Test
    void explicitPageAndSizeWorks() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?page=0&size=5")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number", is(0)))
                .andExpect(jsonPath("$.size", is(5)));
    }

    @Test
    void sizeFiftyWorks() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?size=50")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(50)));
    }

    @Test
    void sizeGreaterThanFiftyReturns400() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?size=51")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void sizeZeroReturns400() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?size=0")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void negativeSizeReturns400() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?size=-1")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void negativePageReturns400() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?page=-1")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void newestListingsAppearFirst() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title", is("Organic Carrots")))
                .andExpect(jsonPath("$.content[1].title", is("Fresh Tomatoes")));
    }

    @Test
    void titleSearchIsCaseInsensitive() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=TOMATO")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Fresh Tomatoes")));
    }

    @Test
    void descriptionSearchIsCaseInsensitive() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=JUICY")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Fresh Tomatoes")));
    }

    @Test
    void searchMatchesEitherTitleOrDescription() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=ORGANIC")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Organic Carrots")));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=CARROT")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Organic Carrots")));
    }

    @Test
    void blankSearchBehavesLikeNoSearch() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=   ")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)));
    }

    @Test
    void nonexistentSearchReturnsEmptyPage() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=nonexistent")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    void paginationMetadataIsCorrect() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.totalPages", is(1)))
                .andExpect(jsonPath("$.number", is(0)))
                .andExpect(jsonPath("$.size", is(20)))
                .andExpect(jsonPath("$.first", is(true)))
                .andExpect(jsonPath("$.last", is(true)));
    }

    @Test
    void sellerIdInResponseIsPopulated() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sellerId", notNullValue()))
                .andExpect(jsonPath("$.content[1].sellerId", notNullValue()));
    }

    @Test
    void inactiveListingsNeverExposedEvenWhenSearchTermsMatch() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=Potatoes")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(0)));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=Onions")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(0)));

        mockMvc.perform(
                        get("/api/v1/marketplace/listings?search=Garlic")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(0)));
    }

    @Test
    void noAuthenticationTokenRequired() throws Exception {
        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                )
                .andExpect(status().isOk());
    }

    @Test
    void tamperedJwtDoesNotAffectAnonymousBrowse() throws Exception {
        String tamperedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.invalid";

        mockMvc.perform(
                        get("/api/v1/marketplace/listings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tamperedToken)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", is(2)));
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