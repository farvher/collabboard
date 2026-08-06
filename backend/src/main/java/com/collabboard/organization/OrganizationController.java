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
@RequestMapping("/api/orgs")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<OrgResponse> create(
            @Valid @RequestBody CreateOrgRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        OrgResponse response = organizationService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<OrgResponse>> listMyOrgs(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<OrgResponse> orgs = organizationService.listByUser(userId);
        return ResponseEntity.ok(orgs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrgResponse> getById(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        OrgResponse response = organizationService.getById(id, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrgResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrgRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        OrgResponse response = organizationService.update(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        organizationService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
