package com.collabboard.organization.dto;

import com.collabboard.organization.OrgRole;
import com.collabboard.organization.Organization;
import com.collabboard.organization.OrgMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgResponse {

    private UUID id;
    private String name;
    private String slug;
    private OrgRole currentUserRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrgResponse from(Organization org, OrgRole role) {
        return OrgResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .currentUserRole(role)
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }
}
