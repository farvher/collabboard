package com.collabboard.organization;

import com.collabboard.organization.dto.*;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrganizationService")
class OrganizationServiceTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrgMemberRepository orgMemberRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private OrganizationService organizationService;

    private UUID userId;
    private UUID orgId;
    private User testUser;
    private Organization testOrg;
    private OrgMember adminMember;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        orgId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("user@test.com")
                .displayName("Test User")
                .passwordHash("hash")
                .build();

        testOrg = Organization.builder()
                .id(orgId)
                .name("Test Organization")
                .slug("test-organization")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        adminMember = OrgMember.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .user(testUser)
                .role(OrgRole.ADMIN)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Create Organization")
    class CreateOrg {

        @Test
        @DisplayName("should create organization and assign ADMIN role to creator")
        void createSuccess() {
            CreateOrgRequest request = new CreateOrgRequest("My New Org");

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(organizationRepository.existsBySlug(anyString())).thenReturn(false);
            when(organizationRepository.save(any(Organization.class))).thenAnswer(inv -> {
                Organization org = inv.getArgument(0);
                org.setId(UUID.randomUUID());
                org.setCreatedAt(LocalDateTime.now());
                org.setUpdatedAt(LocalDateTime.now());
                return org;
            });
            when(orgMemberRepository.save(any(OrgMember.class))).thenReturn(adminMember);

            OrgResponse response = organizationService.create(request, userId);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("My New Org");
            assertThat(response.getCurrentUserRole()).isEqualTo(OrgRole.ADMIN);

            verify(organizationRepository).save(any(Organization.class));
            verify(orgMemberRepository).save(argThat(member ->
                    member.getRole() == OrgRole.ADMIN));
        }

        @Test
        @DisplayName("should generate slug from name")
        void createWithSlug() {
            CreateOrgRequest request = new CreateOrgRequest("Equipo Desarrollo");

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(organizationRepository.existsBySlug(anyString())).thenReturn(false);
            when(organizationRepository.save(any(Organization.class))).thenAnswer(inv -> {
                Organization org = inv.getArgument(0);
                assertThat(org.getSlug()).contains("equipo");
                assertThat(org.getSlug()).contains("desarrollo");
                org.setId(UUID.randomUUID());
                org.setCreatedAt(LocalDateTime.now());
                org.setUpdatedAt(LocalDateTime.now());
                return org;
            });
            when(orgMemberRepository.save(any(OrgMember.class))).thenReturn(adminMember);

            organizationService.create(request, userId);

            verify(organizationRepository).save(any(Organization.class));
        }

        @Test
        @DisplayName("should append UUID suffix if slug already exists")
        void createDuplicateSlug() {
            CreateOrgRequest request = new CreateOrgRequest("Test Org");

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(organizationRepository.existsBySlug("test-org")).thenReturn(true);
            when(organizationRepository.save(any(Organization.class))).thenAnswer(inv -> {
                Organization org = inv.getArgument(0);
                // Slug should have UUID suffix
                assertThat(org.getSlug()).startsWith("test-org-");
                assertThat(org.getSlug().length()).isGreaterThan("test-org".length());
                org.setId(UUID.randomUUID());
                org.setCreatedAt(LocalDateTime.now());
                org.setUpdatedAt(LocalDateTime.now());
                return org;
            });
            when(orgMemberRepository.save(any(OrgMember.class))).thenReturn(adminMember);

            organizationService.create(request, userId);
        }

        @Test
        @DisplayName("should throw when user not found")
        void createUserNotFound() {
            CreateOrgRequest request = new CreateOrgRequest("Org");

            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> organizationService.create(request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("List Organizations")
    class ListOrgs {

        @Test
        @DisplayName("should list organizations for user")
        void listSuccess() {
            when(orgMemberRepository.findByUserId(userId)).thenReturn(List.of(adminMember));

            List<OrgResponse> result = organizationService.listByUser(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Test Organization");
            assertThat(result.get(0).getCurrentUserRole()).isEqualTo(OrgRole.ADMIN);
        }

        @Test
        @DisplayName("should return empty list when user has no orgs")
        void listEmpty() {
            when(orgMemberRepository.findByUserId(userId)).thenReturn(List.of());

            List<OrgResponse> result = organizationService.listByUser(userId);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Organization")
    class GetOrg {

        @Test
        @DisplayName("should get organization for member")
        void getSuccess() {
            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(adminMember));

            OrgResponse response = organizationService.getById(orgId, userId);

            assertThat(response.getId()).isEqualTo(orgId);
            assertThat(response.getName()).isEqualTo("Test Organization");
            assertThat(response.getSlug()).isEqualTo("test-organization");
        }

        @Test
        @DisplayName("should throw when org not found")
        void getNotFound() {
            when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> organizationService.getById(orgId, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Organization not found");
        }

        @Test
        @DisplayName("should deny non-member access")
        void getDenied() {
            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> organizationService.getById(orgId, userId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("not a member");
        }
    }

    @Nested
    @DisplayName("Update Organization")
    class UpdateOrg {

        @Test
        @DisplayName("should update name for admin")
        void updateSuccess() {
            UpdateOrgRequest request = new UpdateOrgRequest("New Name");

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(adminMember));
            when(organizationRepository.save(any(Organization.class))).thenReturn(testOrg);

            OrgResponse response = organizationService.update(orgId, request, userId);

            assertThat(response).isNotNull();
            verify(organizationRepository).save(any(Organization.class));
        }

        @Test
        @DisplayName("should deny non-admin from updating")
        void updateDeniedForMember() {
            UpdateOrgRequest request = new UpdateOrgRequest("New Name");

            OrgMember member = OrgMember.builder()
                    .organization(testOrg)
                    .user(testUser)
                    .role(OrgRole.MEMBER)
                    .build();

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));

            assertThatThrownBy(() -> organizationService.update(orgId, request, userId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Insufficient permissions");
        }
    }

    @Nested
    @DisplayName("Delete Organization")
    class DeleteOrg {

        @Test
        @DisplayName("should delete organization as admin")
        void deleteSuccess() {
            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(adminMember));
            when(orgMemberRepository.findByOrganizationId(orgId)).thenReturn(List.of(adminMember));

            organizationService.delete(orgId, userId);

            verify(orgMemberRepository).deleteAll(List.of(adminMember));
            verify(organizationRepository).delete(testOrg);
        }

        @Test
        @DisplayName("should deny non-admin from deleting")
        void deleteDenied() {
            OrgMember member = OrgMember.builder()
                    .organization(testOrg)
                    .user(testUser)
                    .role(OrgRole.MEMBER)
                    .build();

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));

            assertThatThrownBy(() -> organizationService.delete(orgId, userId))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("Role Hierarchy")
    class RoleHierarchy {

        @Test
        @DisplayName("ADMIN should satisfy ADMIN requirement")
        void adminSatisfiesAdmin() {
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(adminMember));

            // Should not throw
            organizationService.requireRole(orgId, userId, OrgRole.ADMIN);
        }

        @Test
        @DisplayName("ADMIN should satisfy MEMBER requirement")
        void adminSatisfiesMember() {
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(adminMember));

            // ADMIN (ordinal 0) <= MEMBER (ordinal 1) → should pass
            organizationService.requireRole(orgId, userId, OrgRole.MEMBER);
        }

        @Test
        @DisplayName("ADMIN should satisfy GUEST requirement")
        void adminSatisfiesGuest() {
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(adminMember));

            organizationService.requireRole(orgId, userId, OrgRole.GUEST);
        }

        @Test
        @DisplayName("MEMBER should not satisfy ADMIN requirement")
        void memberDoesNotSatisfyAdmin() {
            OrgMember member = OrgMember.builder()
                    .organization(testOrg)
                    .user(testUser)
                    .role(OrgRole.MEMBER)
                    .build();

            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));

            assertThatThrownBy(() -> organizationService.requireRole(orgId, userId, OrgRole.ADMIN))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Insufficient permissions");
        }

        @Test
        @DisplayName("GUEST should not satisfy MEMBER requirement")
        void guestDoesNotSatisfyMember() {
            OrgMember guest = OrgMember.builder()
                    .organization(testOrg)
                    .user(testUser)
                    .role(OrgRole.GUEST)
                    .build();

            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(guest));

            assertThatThrownBy(() -> organizationService.requireRole(orgId, userId, OrgRole.MEMBER))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("non-member should fail any role check")
        void nonMemberFails() {
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> organizationService.requireRole(orgId, userId, OrgRole.GUEST))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("not a member");
        }
    }
}
