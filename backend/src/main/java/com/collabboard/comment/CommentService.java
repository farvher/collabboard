package com.collabboard.comment;

import com.collabboard.board.Board;
import com.collabboard.board.BoardMemberRepository;
import com.collabboard.board.BoardRepository;
import com.collabboard.board.BoardRole;
import com.collabboard.comment.dto.*;
import com.collabboard.organization.AccessDeniedException;
import com.collabboard.organization.OrgMemberRepository;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final UserRepository userRepository;

    /**
     * List comments for a board, optionally filtered by nodeId.
     */
    public List<CommentResponse> listComments(UUID boardId, String nodeId, UUID userId) {
        verifyBoardAccess(boardId, userId);

        List<Comment> comments;
        if (nodeId != null && !nodeId.isBlank()) {
            comments = commentRepository.findByBoardIdAndNodeId(boardId, nodeId);
        } else {
            comments = commentRepository.findByBoardId(boardId);
        }

        return comments.stream()
                .map(CommentResponse::from)
                .toList();
    }

    /**
     * Get unresolved comment counts per node for badge display.
     */
    public Map<String, Long> getCommentCounts(UUID boardId, UUID userId) {
        verifyBoardAccess(boardId, userId);

        return commentRepository.countUnresolvedByNode(boardId).stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    /**
     * Create a new comment on a node.
     */
    @Transactional
    public CommentResponse createComment(UUID boardId, CreateCommentRequest request, UUID userId) {
        verifyBoardAccess(boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .board(board)
                .nodeId(request.getNodeId())
                .user(user)
                .content(request.getContent())
                .build();

        comment = commentRepository.save(comment);
        return CommentResponse.from(comment);
    }

    /**
     * Update a comment. Only the author can edit.
     */
    @Transactional
    public CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        if (!comment.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Only the author can edit this comment");
        }

        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);
        return CommentResponse.from(comment);
    }

    /**
     * Resolve/unresolve a comment. Requires EDITOR+ role on the board.
     */
    @Transactional
    public CommentResponse resolveComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        requireEditAccess(comment.getBoard().getId(), userId);

        comment.setResolved(!comment.getResolved());
        comment = commentRepository.save(comment);
        return CommentResponse.from(comment);
    }

    /**
     * Delete a comment. Author or board OWNER can delete.
     */
    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        boolean isAuthor = comment.getUser().getId().equals(userId);
        boolean isOwner = boardMemberRepository.findByBoardIdAndUserId(comment.getBoard().getId(), userId)
                .map(m -> m.getRole() == BoardRole.OWNER)
                .orElse(false);

        if (!isAuthor && !isOwner) {
            throw new AccessDeniedException("Only the author or board owner can delete this comment");
        }

        commentRepository.delete(comment);
    }

    private void verifyBoardAccess(UUID boardId, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        boolean isOrgMember = orgMemberRepository.existsByOrganizationIdAndUserId(
                board.getOrganization().getId(), userId);
        if (!isOrgMember) {
            throw new AccessDeniedException("You don't have access to this board");
        }
    }

    private void requireEditAccess(UUID boardId, UUID userId) {
        boolean hasAccess = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(m -> m.getRole() == BoardRole.OWNER || m.getRole() == BoardRole.EDITOR)
                .orElse(false);

        if (!hasAccess) {
            throw new AccessDeniedException("You need editor access to resolve comments");
        }
    }
}
