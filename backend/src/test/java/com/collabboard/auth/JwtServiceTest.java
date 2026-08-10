package com.collabboard.auth;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtService")
class JwtServiceTest {

    private JwtService jwtService;
    private static final String SECRET = "test-secret-key-that-is-long-enough-for-hmac-sha256-algorithm-minimum-32-chars";
    private static final long ACCESS_EXPIRATION = 900_000L; // 15 min
    private static final long REFRESH_EXPIRATION = 604_800_000L; // 7 days

    private UUID userId;
    private String email;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION);
        userId = UUID.randomUUID();
        email = "test@example.com";
    }

    @Nested
    @DisplayName("Token Generation")
    class TokenGeneration {

        @Test
        @DisplayName("should generate a non-null access token")
        void generateAccessToken() {
            String token = jwtService.generateAccessToken(userId, email);
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("should generate a non-null refresh token")
        void generateRefreshToken() {
            String token = jwtService.generateRefreshToken(userId, email);
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("access and refresh tokens should be different")
        void tokensDiffer() {
            String access = jwtService.generateAccessToken(userId, email);
            String refresh = jwtService.generateRefreshToken(userId, email);
            assertThat(access).isNotEqualTo(refresh);
        }
    }

    @Nested
    @DisplayName("Claim Extraction")
    class ClaimExtraction {

        @Test
        @DisplayName("should extract userId from access token")
        void extractUserIdFromAccessToken() {
            String token = jwtService.generateAccessToken(userId, email);
            UUID extracted = jwtService.extractUserId(token);
            assertThat(extracted).isEqualTo(userId);
        }

        @Test
        @DisplayName("should extract userId from refresh token")
        void extractUserIdFromRefreshToken() {
            String token = jwtService.generateRefreshToken(userId, email);
            UUID extracted = jwtService.extractUserId(token);
            assertThat(extracted).isEqualTo(userId);
        }

        @Test
        @DisplayName("should extract email from token")
        void extractEmail() {
            String token = jwtService.generateAccessToken(userId, email);
            String extracted = jwtService.extractEmail(token);
            assertThat(extracted).isEqualTo(email);
        }

        @Test
        @DisplayName("should extract all claims from token")
        void extractClaims() {
            String token = jwtService.generateAccessToken(userId, email);
            Claims claims = jwtService.extractClaims(token);

            assertThat(claims.getSubject()).isEqualTo(userId.toString());
            assertThat(claims.get("email", String.class)).isEqualTo(email);
            assertThat(claims.get("type", String.class)).isEqualTo("access");
            assertThat(claims.getIssuedAt()).isNotNull();
            assertThat(claims.getExpiration()).isNotNull();
            assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
        }
    }

    @Nested
    @DisplayName("Token Validation")
    class TokenValidation {

        @Test
        @DisplayName("valid access token should pass validation")
        void validAccessToken() {
            String token = jwtService.generateAccessToken(userId, email);
            assertThat(jwtService.isTokenValid(token)).isTrue();
        }

        @Test
        @DisplayName("valid refresh token should pass validation")
        void validRefreshToken() {
            String token = jwtService.generateRefreshToken(userId, email);
            assertThat(jwtService.isTokenValid(token)).isTrue();
        }

        @Test
        @DisplayName("invalid token should fail validation")
        void invalidToken() {
            assertThat(jwtService.isTokenValid("invalid.token.here")).isFalse();
        }

        @Test
        @DisplayName("null token should fail validation")
        void nullToken() {
            assertThat(jwtService.isTokenValid(null)).isFalse();
        }

        @Test
        @DisplayName("empty token should fail validation")
        void emptyToken() {
            assertThat(jwtService.isTokenValid("")).isFalse();
        }

        @Test
        @DisplayName("expired token should fail validation")
        void expiredToken() {
            // Create service with 0ms expiration (token is immediately expired)
            JwtService expiredService = new JwtService(SECRET, 0L, 0L);
            String token = expiredService.generateAccessToken(userId, email);

            // Small delay to ensure expiration
            try { Thread.sleep(10); } catch (InterruptedException ignored) {}

            assertThat(expiredService.isTokenValid(token)).isFalse();
        }

        @Test
        @DisplayName("token signed with different secret should fail")
        void wrongSecret() {
            JwtService otherService = new JwtService(
                    "another-secret-key-that-is-completely-different-from-original", 
                    ACCESS_EXPIRATION, REFRESH_EXPIRATION);
            String token = otherService.generateAccessToken(userId, email);

            assertThat(jwtService.isTokenValid(token)).isFalse();
        }
    }

    @Nested
    @DisplayName("Token Type Identification")
    class TokenType {

        @Test
        @DisplayName("access token should be identified as access")
        void isAccessToken() {
            String token = jwtService.generateAccessToken(userId, email);
            assertThat(jwtService.isAccessToken(token)).isTrue();
            assertThat(jwtService.isRefreshToken(token)).isFalse();
        }

        @Test
        @DisplayName("refresh token should be identified as refresh")
        void isRefreshToken() {
            String token = jwtService.generateRefreshToken(userId, email);
            assertThat(jwtService.isRefreshToken(token)).isTrue();
            assertThat(jwtService.isAccessToken(token)).isFalse();
        }

        @Test
        @DisplayName("invalid token should not be identified as any type")
        void invalidTokenType() {
            assertThat(jwtService.isAccessToken("garbage")).isFalse();
            assertThat(jwtService.isRefreshToken("garbage")).isFalse();
        }
    }
}
