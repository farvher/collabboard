package com.collabboard.organization;

import com.collabboard.organization.dto.*;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrgResponse create(CreateOrgRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        String slug = generateSlug(request.getName());

        Organization org = Organization.builder()
                .name(request.getName())
                .slug(slug)
                .build();
        org = organizationRepository.save(org);

        OrgMember member = OrgMember.builder()
                .organization(org)
                .user(user)
                .role(OrgRole.ADMIN)
                .build();
        orgMemberRepository.save(member);

        return OrgResponse.from(org, OrgRole.ADMIN);
    }

    public List<OrgResponse> listByUser(UUID userId) {
        List<OrgMember> memberships = orgMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> OrgResponse.from(m.getOrganization(), m.getRole()))
                .toList();
    }

    public OrgResponse getById(UUID orgId, UUID userId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        OrgMember member = orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));

        return OrgResponse.from(org, member.getRole());
    }

    @Transactional
    public OrgResponse update(UUID orgId, UpdateOrgRequest request, UUID userId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        requireRole(orgId, userId, OrgRole.ADMIN);

        org.setName(request.getName());
        org = organizationRepository.save(org);

        OrgMember member = orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId).orElseThrow();
        return OrgResponse.from(org, member.getRole());
    }

    @Transactional
    public void delete(UUID orgId, UUID userId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        requireRole(orgId, userId, OrgRole.ADMIN);

        // Delete members first to avoid Hibernate session conflicts
        List<OrgMember> members = orgMemberRepository.findByOrganizationId(orgId);
        orgMemberRepository.deleteAll(members);
        organizationRepository.delete(org);
    }

    public void requireRole(UUID orgId, UUID userId, OrgRole minimumRole) {
        OrgMember member = orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));

        if (!hasMinimumRole(member.getRole(), minimumRole)) {
            throw new AccessDeniedException("Insufficient permissions");
        }
    }

    private boolean hasMinimumRole(OrgRole actual, OrgRole required) {
        return actual.ordinal() <= required.ordinal();
        // ADMIN=0, MEMBER=1, GUEST=2 → lower ordinal = higher privilege
    }

    private String generateSlug(String name) {
        String normalized = Normalizer.normalize(name.toLowerCase(), Normalizer.Form.NFD);
        String slug = Pattern.compile("[^a-z0-9\\s-]").matcher(normalized).replaceAll("");
        slug = slug.trim().replaceAll("\\s+", "-");

        if (organizationRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 6);
        }

        return slug;
    }
}
