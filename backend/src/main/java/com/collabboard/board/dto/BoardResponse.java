package com.collabboard.board.dto;

import com.collabboard.board.Board;
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
public class BoardResponse {

    private UUID id;
    private UUID orgId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String createdByName;
    private BoardRole currentUserRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BoardResponse from(Board board, BoardRole role) {
        return BoardResponse.builder()
                .id(board.getId())
                .orgId(board.getOrganization().getId())
                .name(board.getName())
                .description(board.getDescription())
                .thumbnailUrl(board.getThumbnailUrl())
                .createdByName(board.getCreatedBy().getDisplayName())
                .currentUserRole(role)
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
