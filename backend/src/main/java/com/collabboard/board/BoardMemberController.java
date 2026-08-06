package com.collabboard.board;

import com.collabboard.board.dto.*;
import com.collabboard.organization.AccessDeniedException;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/members")
@RequiredArgsConstructor
public class BoardMemberController {

    private final BoardMemberRepository boardMemberRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<BoardMemberResponse>> listMembers(
            @PathVariable UUID boardId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        verifyBoardAccess(boardId, userId);

        List<BoardMember> members = boardMemberRepository.findByBoardId(boardId);
        List<BoardMemberResponse> response = members.stream()
                .map(BoardMemberResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<BoardMemberResponse> addMember(
            @PathVariable UUID boardId,
            @Valid @RequestBody AddBoardMemberRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        requireOwnerRole(boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getEmail()));

        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalStateException("User is already a member of this board");
        }

        BoardMember member = BoardMember.builder()
                .board(board)
                .user(user)
                .role(request.getRole())
                .build();
        member = boardMemberRepository.save(member);

        return ResponseEntity.status(HttpStatus.CREATED).body(BoardMemberResponse.from(member));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID boardId,
            @PathVariable UUID memberId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        requireOwnerRole(boardId, userId);

        BoardMember member = boardMemberRepository.findByBoardIdAndUserId(boardId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("Member not found"));

        if (member.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Cannot remove yourself from the board");
        }

        boardMemberRepository.delete(member);
        return ResponseEntity.noContent().build();
    }

    private void verifyBoardAccess(UUID boardId, UUID userId) {
        if (!boardMemberRepository.existsByBoardIdAndUserId(boardId, userId)) {
            throw new AccessDeniedException("You don't have access to this board");
        }
    }

    private void requireOwnerRole(UUID boardId, UUID userId) {
        boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .filter(m -> m.getRole() == BoardRole.OWNER)
                .orElseThrow(() -> new AccessDeniedException("Only board owner can manage members"));
    }
}
