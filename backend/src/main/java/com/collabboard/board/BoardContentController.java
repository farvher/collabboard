package com.collabboard.board;

import com.collabboard.board.dto.BoardContentResponse;
import com.collabboard.board.dto.SaveContentRequest;
import com.collabboard.organization.AccessDeniedException;
import com.collabboard.organization.OrgMemberRepository;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/content")
@RequiredArgsConstructor
public class BoardContentController {

    private final BoardContentRepository boardContentRepository;
    private final BoardRepository boardRepository;
    private final BoardVersionRepository boardVersionRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<BoardContentResponse> getContent(
            @PathVariable UUID boardId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        BoardContent content = boardContentRepository.findByBoardId(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board content not found"));

        return ResponseEntity.ok(BoardContentResponse.from(content));
    }

    @PutMapping
    @Transactional
    public ResponseEntity<BoardContentResponse> saveContent(
            @PathVariable UUID boardId,
            @Valid @RequestBody SaveContentRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        BoardContent content = boardContentRepository.findByBoardId(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board content not found"));

        // Optimistic locking: check version
        if (!content.getVersion().equals(request.getExpectedVersion())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        content.setCanvasData(request.getCanvasData());
        content.setVersion(content.getVersion() + 1);
        content.setLastSavedBy(user);
        content.setUpdatedAt(LocalDateTime.now());

        content = boardContentRepository.save(content);

        // Auto-create version snapshot
        BoardVersion version = BoardVersion.builder()
                .board(content.getBoard())
                .savedBy(user)
                .canvasSnapshot(request.getCanvasData())
                .versionNumber(content.getVersion())
                .build();
        boardVersionRepository.save(version);

        return ResponseEntity.ok(BoardContentResponse.from(content));
    }

    @GetMapping("/version")
    public ResponseEntity<VersionResponse> getVersion(
            @PathVariable UUID boardId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        BoardContent content = boardContentRepository.findByBoardId(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board content not found"));

        return ResponseEntity.ok(new VersionResponse(
                content.getVersion(),
                content.getUpdatedAt(),
                content.getLastSavedBy() != null ? content.getLastSavedBy().getDisplayName() : null
        ));
    }

    private void verifyAccess(UUID boardId, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        boolean isOrgMember = orgMemberRepository.existsByOrganizationIdAndUserId(
                board.getOrganization().getId(), userId);
        if (!isOrgMember) {
            throw new AccessDeniedException("You don't have access to this board");
        }
    }

    public record VersionResponse(Integer version, LocalDateTime updatedAt, String lastSavedBy) {}
}
