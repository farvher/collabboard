package com.collabboard.organization.dto;

import com.collabboard.organization.OrgMember;
import com.collabboard.organization.OrgRole;
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
public class OrgMemberResponse {

    private UUID userId;
    private String email;
    private String displayName;
    private OrgRole role;
    private LocalDateTime joinedAt;

    public static OrgMemberResponse from(OrgMember member) {
        return OrgMemberResponse.builder()
                .userId(member.getUser().getId())
                .email(member.getUser().getEmail())
                .displayName(member.getUser().getDisplayName())
                .role(member.getRole())
                .joinedAt(member.getCreatedAt())
                .build();
    }
}
