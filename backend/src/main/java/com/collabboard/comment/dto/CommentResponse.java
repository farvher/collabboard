package com.collabboard.comment.dto;

import com.collabboard.comment.Comment;
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
public class CommentResponse {

    private UUID id;
    private UUID boardId;
    private String nodeId;
    private UUID userId;
    private String userName;
    private String content;
    private Boolean resolved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse from(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .boardId(comment.getBoard().getId())
                .nodeId(comment.getNodeId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getDisplayName() != null
                        ? comment.getUser().getDisplayName()
                        : comment.getUser().getEmail())
                .content(comment.getContent())
                .resolved(comment.getResolved())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
