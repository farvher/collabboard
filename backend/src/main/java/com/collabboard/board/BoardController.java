package com.collabboard.board;

import com.collabboard.board.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping("/api/orgs/{orgId}/boards")
    public ResponseEntity<BoardResponse> create(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateBoardRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        BoardResponse response = boardService.create(orgId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/orgs/{orgId}/boards")
    public ResponseEntity<Page<BoardResponse>> listByOrg(
            @PathVariable UUID orgId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Page<BoardResponse> boards = boardService.listByOrganization(orgId, search, pageable, userId);
        return ResponseEntity.ok(boards);
    }

    @GetMapping("/api/boards/{id}")
    public ResponseEntity<BoardResponse> getById(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        BoardResponse response = boardService.getById(id, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/boards/{id}")
    public ResponseEntity<BoardResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBoardRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        BoardResponse response = boardService.update(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/boards/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        boardService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
