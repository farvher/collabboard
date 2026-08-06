package com.collabboard.board.dto;

import com.collabboard.board.BoardContent;
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
public class BoardContentResponse {

    private UUID boardId;
    private String canvasData;
    private Integer version;
    private String lastSavedByName;
    private LocalDateTime updatedAt;

    public static BoardContentResponse from(BoardContent content) {
        return BoardContentResponse.builder()
                .boardId(content.getBoard().getId())
                .canvasData(content.getCanvasData())
                .version(content.getVersion())
                .lastSavedByName(content.getLastSavedBy() != null
                        ? content.getLastSavedBy().getDisplayName()
                        : null)
                .updatedAt(content.getUpdatedAt())
                .build();
    }
}
