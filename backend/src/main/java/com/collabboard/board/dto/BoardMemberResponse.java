package com.collabboard.board.dto;

import com.collabboard.board.BoardMember;
import com.collabboard.board.BoardRole;
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
public class BoardMemberResponse {

    private UUID userId;
    private String email;
    private String displayName;
    private BoardRole role;
    private LocalDateTime joinedAt;

    public static BoardMemberResponse from(BoardMember member) {
        return BoardMemberResponse.builder()
                .userId(member.getUser().getId())
                .email(member.getUser().getEmail())
                .displayName(member.getUser().getDisplayName())
                .role(member.getRole())
                .joinedAt(member.getCreatedAt())
                .build();
    }
}
