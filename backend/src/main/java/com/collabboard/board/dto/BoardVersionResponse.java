package com.collabboard.board.dto;

import com.collabboard.board.BoardVersion;
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
public class BoardVersionResponse {

    private UUID id;
    private Integer versionNumber;
    private String savedByName;
    private String canvasSnapshot;
    private LocalDateTime createdAt;

    public static BoardVersionResponse from(BoardVersion version, boolean includeSnapshot) {
        return BoardVersionResponse.builder()
                .id(version.getId())
                .versionNumber(version.getVersionNumber())
                .savedByName(version.getSavedBy().getDisplayName())
                .canvasSnapshot(includeSnapshot ? version.getCanvasSnapshot() : null)
                .createdAt(version.getCreatedAt())
                .build();
    }
}
