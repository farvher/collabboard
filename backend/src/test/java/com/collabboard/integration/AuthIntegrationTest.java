package com.collabboard.integration;

import com.collabboard.AbstractIntegrationTest;
import com.collabboard.auth.dto.*;
import com.collabboard.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Auth Integration Tests")
class AuthIntegrationTest extends AbstractIntegrationTest {

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("should register new user and return tokens")
        void registerSuccess() throws Exception {
            RegisterRequest request = new RegisterRequest("newuser@integration.com", "password123", "New User");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.user.email").value("newuser@integration.com"))
                    .andExpect(jsonPath("$.user.displayName").value("New User"))
                    .andExpect(jsonPath("$.user.id").isNotEmpty());
        }

        @Test
        @DisplayName("should reject duplicate email with 409")
        void registerDuplicate() throws Exception {
            createTestUser("duplicate@integration.com", "Existing");

            RegisterRequest request = new RegisterRequest("duplicate@integration.com", "password123", "Dup");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("duplicate@integration.com")));
        }

        @Test
        @DisplayName("should reject invalid email format")
        void registerInvalidEmail() throws Exception {
            RegisterRequest request = new RegisterRequest("not-an-email", "password123", "User");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.email").isNotEmpty());
        }

        @Test
        @DisplayName("should reject short password")
        void registerShortPassword() throws Exception {
            RegisterRequest request = new RegisterRequest("short@test.com", "1234567", "User");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty());
        }

        @Test
        @DisplayName("should reject blank email")
        void registerBlankEmail() throws Exception {
            RegisterRequest request = new RegisterRequest("", "password123", "User");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("should login with valid credentials")
        void loginSuccess() throws Exception {
            createTestUser("login@integration.com", "Login User");

            LoginRequest request = new LoginRequest("login@integration.com", "password123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.user.email").value("login@integration.com"));
        }

        @Test
        @DisplayName("should return 401 for wrong password")
        void loginWrongPassword() throws Exception {
            createTestUser("wrongpw@integration.com", "User");

            LoginRequest request = new LoginRequest("wrongpw@integration.com", "wrongpassword");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        @Test
        @DisplayName("should return 401 for non-existent email")
        void loginNonExistent() throws Exception {
            LoginRequest request = new LoginRequest("nobody@integration.com", "password123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("should refresh tokens with valid refresh token")
        void refreshSuccess() throws Exception {
            User user = createTestUser("refresh@integration.com", "Refresh User");
            String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail());

            RefreshRequest request = new RefreshRequest(refreshToken);

            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.user.email").value("refresh@integration.com"));
        }

        @Test
        @DisplayName("should reject invalid refresh token")
        void refreshInvalid() throws Exception {
            RefreshRequest request = new RefreshRequest("invalid-token");

            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should reject access token used as refresh")
        void refreshWithAccessToken() throws Exception {
            User user = createTestUser("norefresh@integration.com", "User");
            String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());

            RefreshRequest request = new RefreshRequest(accessToken);

            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value(containsString("not a refresh token")));
        }
    }

    @Nested
    @DisplayName("Protected Endpoints")
    class ProtectedEndpoints {

        @Test
        @DisplayName("should access protected endpoint with valid token")
        void accessWithToken() throws Exception {
            User user = createTestUser("protected@integration.com", "Protected User");

            mockMvc.perform(get("/api/orgs")
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 401 without token")
        void accessWithoutToken() throws Exception {
            mockMvc.perform(get("/api/orgs"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 with invalid token")
        void accessWithInvalidToken() throws Exception {
            mockMvc.perform(get("/api/orgs")
                            .header("Authorization", "Bearer invalid-token"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should allow unauthenticated access to health endpoint")
        void healthPublic() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Full Auth Flow")
    class FullFlow {

        @Test
        @DisplayName("register -> login -> access protected -> refresh -> access again")
        void fullAuthFlow() throws Exception {
            // 1. Register
            RegisterRequest registerReq = new RegisterRequest("flow@integration.com", "password123", "Flow User");
            MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerReq)))
                    .andExpect(status().isCreated())
                    .andReturn();

            AuthResponse registerResponse = objectMapper.readValue(
                    registerResult.getResponse().getContentAsString(), AuthResponse.class);

            // 2. Access protected endpoint with access token
            mockMvc.perform(get("/api/orgs")
                            .header("Authorization", "Bearer " + registerResponse.getAccessToken()))
                    .andExpect(status().isOk());

            // 3. Login with same credentials
            LoginRequest loginReq = new LoginRequest("flow@integration.com", "password123");
            MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthResponse loginResponse = objectMapper.readValue(
                    loginResult.getResponse().getContentAsString(), AuthResponse.class);

            // 4. Refresh tokens
            RefreshRequest refreshReq = new RefreshRequest(loginResponse.getRefreshToken());
            MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(refreshReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthResponse refreshResponse = objectMapper.readValue(
                    refreshResult.getResponse().getContentAsString(), AuthResponse.class);

            // 5. Access protected endpoint with new tokens
            mockMvc.perform(get("/api/orgs")
                            .header("Authorization", "Bearer " + refreshResponse.getAccessToken()))
                    .andExpect(status().isOk());

            // Verify tokens are different after refresh
            assertThat(refreshResponse.getAccessToken()).isNotEqualTo(loginResponse.getAccessToken());
        }
    }
}
