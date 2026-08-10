package com.collabboard.auth;

import com.collabboard.auth.dto.*;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = User.builder()
                .id(userId)
                .email("user@test.com")
                .passwordHash("encoded-password")
                .displayName("Test User")
                .build();
    }

    @Nested
    @DisplayName("Register")
    class Register {

        @Test
        @DisplayName("should register new user successfully")
        void registerSuccess() {
            RegisterRequest request = new RegisterRequest("new@test.com", "password123", "New User");

            when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encoded-pw");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });
            when(jwtService.generateAccessToken(any(UUID.class), anyString())).thenReturn("access-token");
            when(jwtService.generateRefreshToken(any(UUID.class), anyString())).thenReturn("refresh-token");

            AuthResponse response = authService.register(request);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            assertThat(response.getUser().getEmail()).isEqualTo("new@test.com");
            assertThat(response.getUser().getDisplayName()).isEqualTo("New User");

            verify(userRepository).save(any(User.class));
            verify(passwordEncoder).encode("password123");
        }

        @Test
        @DisplayName("should throw when email already exists")
        void registerDuplicateEmail() {
            RegisterRequest request = new RegisterRequest("existing@test.com", "password123", "User");

            when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessageContaining("existing@test.com");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Login")
    class Login {

        @Test
        @DisplayName("should login with valid credentials")
        void loginSuccess() {
            LoginRequest request = new LoginRequest("user@test.com", "password123");

            when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
            when(jwtService.generateAccessToken(userId, "user@test.com")).thenReturn("access-token");
            when(jwtService.generateRefreshToken(userId, "user@test.com")).thenReturn("refresh-token");

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            assertThat(response.getUser().getId()).isEqualTo(userId);
            assertThat(response.getUser().getEmail()).isEqualTo("user@test.com");
        }

        @Test
        @DisplayName("should throw on non-existent email")
        void loginEmailNotFound() {
            LoginRequest request = new LoginRequest("nobody@test.com", "password123");

            when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessageContaining("Invalid email or password");
        }

        @Test
        @DisplayName("should throw on wrong password")
        void loginWrongPassword() {
            LoginRequest request = new LoginRequest("user@test.com", "wrong-password");

            when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessageContaining("Invalid email or password");
        }
    }

    @Nested
    @DisplayName("Refresh")
    class Refresh {

        @Test
        @DisplayName("should refresh with valid refresh token")
        void refreshSuccess() {
            RefreshRequest request = new RefreshRequest("valid-refresh-token");

            when(jwtService.isTokenValid("valid-refresh-token")).thenReturn(true);
            when(jwtService.isRefreshToken("valid-refresh-token")).thenReturn(true);
            when(jwtService.extractUserId("valid-refresh-token")).thenReturn(userId);
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(jwtService.generateAccessToken(userId, "user@test.com")).thenReturn("new-access");
            when(jwtService.generateRefreshToken(userId, "user@test.com")).thenReturn("new-refresh");

            AuthResponse response = authService.refresh(request);

            assertThat(response.getAccessToken()).isEqualTo("new-access");
            assertThat(response.getRefreshToken()).isEqualTo("new-refresh");
            assertThat(response.getUser().getId()).isEqualTo(userId);
        }

        @Test
        @DisplayName("should throw on invalid refresh token")
        void refreshInvalidToken() {
            RefreshRequest request = new RefreshRequest("invalid-token");

            when(jwtService.isTokenValid("invalid-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("Invalid or expired refresh token");
        }

        @Test
        @DisplayName("should throw when token is not a refresh token")
        void refreshWithAccessToken() {
            RefreshRequest request = new RefreshRequest("access-token");

            when(jwtService.isTokenValid("access-token")).thenReturn(true);
            when(jwtService.isRefreshToken("access-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("Token is not a refresh token");
        }

        @Test
        @DisplayName("should throw when user no longer exists")
        void refreshUserNotFound() {
            RefreshRequest request = new RefreshRequest("valid-refresh-token");

            when(jwtService.isTokenValid("valid-refresh-token")).thenReturn(true);
            when(jwtService.isRefreshToken("valid-refresh-token")).thenReturn(true);
            when(jwtService.extractUserId("valid-refresh-token")).thenReturn(userId);
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("User not found");
        }
    }
}
