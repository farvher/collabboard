package com.collabboard.organization;

import com.collabboard.organization.dto.*;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrgMemberService {

    private final OrgMemberRepository orgMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationService organizationService;
    private final UserRepository userRepository;

    public List<OrgMemberResponse> listMembers(UUID orgId, UUID requesterId) {
        organizationService.requireRole(orgId, requesterId, OrgRole.GUEST);

        List<OrgMember> members = orgMemberRepository.findByOrganizationId(orgId);
        return members.stream()
                .map(OrgMemberResponse::from)
                .toList();
    }

    @Transactional
    public OrgMemberResponse addMember(UUID orgId, AddMemberRequest request, UUID requesterId) {
        organizationService.requireRole(orgId, requesterId, OrgRole.ADMIN);

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + request.getEmail()));

        if (orgMemberRepository.existsByOrganizationIdAndUserId(orgId, user.getId())) {
            throw new IllegalStateException("User is already a member of this organization");
        }

        OrgMember member = OrgMember.builder()
                .organization(org)
                .user(user)
                .role(request.getRole())
                .build();
        member = orgMemberRepository.save(member);

        return OrgMemberResponse.from(member);
    }

    @Transactional
    public OrgMemberResponse updateRole(UUID orgId, UUID memberId, UpdateMemberRoleRequest request, UUID requesterId) {
        organizationService.requireRole(orgId, requesterId, OrgRole.ADMIN);

        OrgMember member = orgMemberRepository.findByOrganizationIdAndUserId(orgId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("Member not found"));

        if (member.getUser().getId().equals(requesterId)) {
            throw new IllegalStateException("Cannot change your own role");
        }

        member.setRole(request.getRole());
        member = orgMemberRepository.save(member);

        return OrgMemberResponse.from(member);
    }

    @Transactional
    public void removeMember(UUID orgId, UUID memberId, UUID requesterId) {
        organizationService.requireRole(orgId, requesterId, OrgRole.ADMIN);

        OrgMember member = orgMemberRepository.findByOrganizationIdAndUserId(orgId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("Member not found"));

        if (member.getUser().getId().equals(requesterId)) {
            throw new IllegalStateException("Cannot remove yourself from the organization");
        }

        orgMemberRepository.delete(member);
    }
}
