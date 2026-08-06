package com.collabboard.board;

import com.collabboard.board.dto.*;
import com.collabboard.organization.AccessDeniedException;
import com.collabboard.organization.OrgMemberRepository;
import com.collabboard.organization.OrgRole;
import com.collabboard.organization.Organization;
import com.collabboard.organization.OrganizationRepository;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardContentRepository boardContentRepository;
    private final BoardTemplateRepository boardTemplateRepository;
    private final OrganizationRepository organizationRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public BoardResponse create(UUID orgId, CreateBoardRequest request, UUID userId) {
        // Verify user is member of org (at least MEMBER role)
        orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .filter(m -> m.getRole() != OrgRole.GUEST)
                .orElseThrow(() -> new AccessDeniedException("You must be a member to create boards"));

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Board board = Board.builder()
                .organization(org)
                .createdBy(user)
                .name(request.getName())
                .description(request.getDescription())
                .build();
        board = boardRepository.save(board);

        // Auto-assign OWNER role
        BoardMember member = BoardMember.builder()
                .board(board)
                .user(user)
                .role(BoardRole.OWNER)
                .build();
        boardMemberRepository.save(member);

        // Create board content (from template or empty)
        String canvasData = "{}";
        if (request.getTemplateId() != null) {
            BoardTemplate template = boardTemplateRepository.findById(request.getTemplateId())
                    .orElseThrow(() -> new EntityNotFoundException("Template not found"));
            canvasData = template.getCanvasData();
        }

        BoardContent content = BoardContent.builder()
                .board(board)
                .canvasData(canvasData)
                .version(1)
                .build();
        boardContentRepository.save(content);

        return BoardResponse.from(board, BoardRole.OWNER);
    }

    public Page<BoardResponse> listByOrganization(UUID orgId, String search, Pageable pageable, UUID userId) {
        // Verify user is member of org
        orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));

        Page<Board> boards;
        if (search != null && !search.isBlank()) {
            boards = boardRepository.searchByOrganization(orgId, search, pageable);
        } else {
            boards = boardRepository.findByOrganizationId(orgId, pageable);
        }

        return boards.map(board -> {
            BoardRole role = boardMemberRepository.findByBoardIdAndUserId(board.getId(), userId)
                    .map(BoardMember::getRole)
                    .orElse(null);
            return BoardResponse.from(board, role);
        });
    }

    public BoardResponse getById(UUID boardId, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        // Check org membership or board membership
        boolean isOrgMember = orgMemberRepository.existsByOrganizationIdAndUserId(
                board.getOrganization().getId(), userId);
        if (!isOrgMember) {
            throw new AccessDeniedException("You don't have access to this board");
        }

        BoardRole role = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(BoardMember::getRole)
                .orElse(null);

        return BoardResponse.from(board, role);
    }

    @Transactional
    public BoardResponse update(UUID boardId, UpdateBoardRequest request, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        requireBoardEditAccess(boardId, board.getOrganization().getId(), userId);

        board.setName(request.getName());
        board.setDescription(request.getDescription());
        board = boardRepository.save(board);

        BoardRole role = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(BoardMember::getRole)
                .orElse(null);

        return BoardResponse.from(board, role);
    }

    @Transactional
    public void delete(UUID boardId, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found"));

        // Only OWNER or ORG ADMIN can delete
        boolean isOwner = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(m -> m.getRole() == BoardRole.OWNER)
                .orElse(false);

        boolean isOrgAdmin = orgMemberRepository.findByOrganizationIdAndUserId(
                board.getOrganization().getId(), userId)
                .map(m -> m.getRole() == OrgRole.ADMIN)
                .orElse(false);

        if (!isOwner && !isOrgAdmin) {
            throw new AccessDeniedException("Only board owner or org admin can delete boards");
        }

        boardContentRepository.findByBoardId(boardId).ifPresent(boardContentRepository::delete);
        boardMemberRepository.findByBoardId(boardId).forEach(boardMemberRepository::delete);
        boardRepository.delete(board);
    }

    private void requireBoardEditAccess(UUID boardId, UUID orgId, UUID userId) {
        // Board OWNER or EDITOR can edit
        boolean hasBoardAccess = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(m -> m.getRole() == BoardRole.OWNER || m.getRole() == BoardRole.EDITOR)
                .orElse(false);

        // ORG ADMIN can also edit
        boolean isOrgAdmin = orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .map(m -> m.getRole() == OrgRole.ADMIN)
                .orElse(false);

        if (!hasBoardAccess && !isOrgAdmin) {
            throw new AccessDeniedException("You don't have edit access to this board");
        }
    }
}
