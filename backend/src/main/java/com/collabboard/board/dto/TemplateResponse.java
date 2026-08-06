package com.collabboard.board.dto;

import com.collabboard.board.BoardTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateResponse {

    private UUID id;
    private String name;
    private String description;
    private String category;
    private String canvasData;
    private String thumbnailUrl;

    public static TemplateResponse from(BoardTemplate template) {
        return TemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .category(template.getCategory())
                .canvasData(template.getCanvasData())
                .thumbnailUrl(template.getThumbnailUrl())
                .build();
    }
}
