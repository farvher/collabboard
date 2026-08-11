package com.collabboard.comment;

import com.collabboard.comment.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * List comments for a board, optionally filtered by nodeId.
     */
    @GetMapping("/api/boards/{boardId}/comments")
    public ResponseEntity<List<CommentResponse>> listComments(
            @PathVariable UUID boardId,
            @RequestParam(required = false) String nodeId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<CommentResponse> comments = commentService.listComments(boardId, nodeId, userId);
        return ResponseEntity.ok(comments);
    }

    /**
     * Get unresolved comment counts per node (for badge display).
     */
    @GetMapping("/api/boards/{boardId}/comments/counts")
    public ResponseEntity<Map<String, Long>> getCommentCounts(
            @PathVariable UUID boardId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Map<String, Long> counts = commentService.getCommentCounts(boardId, userId);
        return ResponseEntity.ok(counts);
    }

    /**
     * Create a comment on a node.
     */
    @PostMapping("/api/boards/{boardId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable UUID boardId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        CommentResponse response = commentService.createComment(boardId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a comment (author only).
     */
    @PutMapping("/api/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        CommentResponse response = commentService.updateComment(commentId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Toggle resolved status (EDITOR+ only).
     */
    @PutMapping("/api/comments/{commentId}/resolve")
    public ResponseEntity<CommentResponse> resolveComment(
            @PathVariable UUID commentId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        CommentResponse response = commentService.resolveComment(commentId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a comment (author or board owner).
     */
    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID commentId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}
