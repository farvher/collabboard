package com.collabboard.organization;

import com.collabboard.organization.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orgs/{orgId}/members")
@RequiredArgsConstructor
public class OrgMemberController {

    private final OrgMemberService orgMemberService;

    @GetMapping
    public ResponseEntity<List<OrgMemberResponse>> listMembers(
            @PathVariable UUID orgId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<OrgMemberResponse> members = orgMemberService.listMembers(orgId, userId);
        return ResponseEntity.ok(members);
    }

    @PostMapping
    public ResponseEntity<OrgMemberResponse> addMember(
            @PathVariable UUID orgId,
            @Valid @RequestBody AddMemberRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        OrgMemberResponse response = orgMemberService.addMember(orgId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{memberId}")
    public ResponseEntity<OrgMemberResponse> updateRole(
            @PathVariable UUID orgId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        OrgMemberResponse response = orgMemberService.updateRole(orgId, memberId, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID orgId,
            @PathVariable UUID memberId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        orgMemberService.removeMember(orgId, memberId, userId);
        return ResponseEntity.noContent().build();
    }
}
