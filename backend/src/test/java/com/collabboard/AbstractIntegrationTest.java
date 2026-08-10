package com.collabboard;

import com.collabboard.auth.JwtService;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

/**
 * Base class for integration tests.
 * Provides PostgreSQL and MinIO containers via Testcontainers,
 * MockMvc for HTTP requests, and helper methods for auth.
 *
 * Tests extending this class are automatically skipped if Docker is not available.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("collabboard_test")
            .withUsername("test")
            .withPassword("test");

    @Container
    static MinIOContainer minio = new MinIOContainer("minio/minio:latest")
            .withUserName("minioadmin")
            .withPassword("minioadmin123");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // PostgreSQL
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        // MinIO
        registry.add("minio.endpoint", minio::getS3URL);
        registry.add("minio.access-key", () -> "minioadmin");
        registry.add("minio.secret-key", () -> "minioadmin123");
        registry.add("minio.bucket-name", () -> "collabboard-test");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected MinioClient minioClient;

    private static boolean bucketInitialized = false;

    @BeforeEach
    void ensureBucket() throws Exception {
        if (!bucketInitialized) {
            String bucket = "collabboard-test";
            if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            bucketInitialized = true;
        }
    }

    // ========== Helper Methods ==========

    /**
     * Create a test user and return it.
     */
    protected User createTestUser(String email, String displayName) {
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .displayName(displayName)
                .build();
        return userRepository.save(user);
    }

    /**
     * Generate a valid access token for the given user.
     */
    protected String tokenForUser(User user) {
        return jwtService.generateAccessToken(user.getId(), user.getEmail());
    }

    /**
     * Create a test user and return a Bearer token header value.
     */
    protected String bearerToken(User user) {
        return "Bearer " + tokenForUser(user);
    }

    /**
     * Generate a Bearer token for a random non-existent user (for 404/forbidden tests).
     */
    protected String bearerTokenForRandomUser() {
        UUID randomId = UUID.randomUUID();
        return "Bearer " + jwtService.generateAccessToken(randomId, "random@test.com");
    }
}
