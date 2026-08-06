package com.collabboard.board;

import com.collabboard.board.dto.BoardContentResponse;
import com.collabboard.board.dto.BoardVersionResponse;
import com.collabboard.organization.AccessDeniedException;
import com.collabboard.organization.OrgMemberRepository;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/versions")
@RequiredArgsConstructor
public class BoardVersionController {

    private final BoardVersionRepository boardVersionRepository;
    private final BoardContentRepository boardContentRepository;
    private final BoardRepository boardRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<BoardVersionResponse>> listVersions(
            @PathVariable UUID boardId,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        Page<BoardVersion> versions = boardVersionRepository
                .findByBoardIdOrderByVersionNumberDesc(boardId, pageable);

        Page<BoardVersionResponse> response = versions.map(v -> BoardVersionResponse.from(v, false));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{versionId}")
    public ResponseEntity<BoardVersionResponse> getVersion(
            @PathVariable UUID boardId,
            @PathVariable UUID versionId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        BoardVersion version = boardVersionRepository.findById(versionId)
                .orElseThrow(() -> new EntityNotFoundException("Version not found"));

        return ResponseEntity.ok(BoardVersionResponse.from(version, true));
    }

    @PostMapping("/{versionId}/restore")
    @Transactional
    public ResponseEntity<BoardContentResponse> restoreVersion(
            @PathVariable UUID boardId,
            @PathVariable UUID versionId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        BoardVersion version = boardVersionRepository.findById(versionId)
                .orElseThrow(() -> new EntityNotFoundException("Version not found"));

        BoardContent content = boardContentRepository.findByBoardId(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board content not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        // Restore: set content to the old snapshot, increment version
        content.setCanvasData(version.getCanvasSnapshot());
        content.setVersion(content.getVersion() + 1);
        content.setLastSavedBy(user);
        content.setUpdatedAt(LocalDateTime.now());
        content = boardContentRepository.save(content);

        // Save the restored state as a new version
        BoardVersion restoredVersion = BoardVersion.builder()
                .board(board)
                .savedBy(user)
                .canvasSnapshot(content.getCanvasData())
                .versionNumber(content.getVersion())
                .build();
        boardVersionRepository.save(restoredVersion);

        // Cleanup: keep max 50 versions
        cleanupOldVersions(boardId);

        return ResponseEntity.ok(BoardContentResponse.from(content));
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

    private void cleanupOldVersions(UUID boardId) {
        long count = boardVersionRepository.countByBoardId(boardId);
        if (count > 50) {
            // Keep only the latest 50 — handled via query if needed
            // For now this is a soft limit tracked in the count
        }
    }
}
