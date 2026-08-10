package com.collabboard.board;

import com.collabboard.board.dto.*;
import com.collabboard.organization.*;
import com.collabboard.user.User;
import com.collabboard.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BoardService")
class BoardServiceTest {

    @Mock private BoardRepository boardRepository;
    @Mock private BoardMemberRepository boardMemberRepository;
    @Mock private BoardContentRepository boardContentRepository;
    @Mock private BoardTemplateRepository boardTemplateRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrgMemberRepository orgMemberRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private BoardService boardService;

    private UUID userId;
    private UUID orgId;
    private UUID boardId;
    private User testUser;
    private Organization testOrg;
    private Board testBoard;
    private OrgMember adminMember;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        orgId = UUID.randomUUID();
        boardId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("user@test.com")
                .displayName("Test User")
                .passwordHash("hash")
                .build();

        testOrg = Organization.builder()
                .id(orgId)
                .name("Test Org")
                .slug("test-org")
                .build();

        testBoard = Board.builder()
                .id(boardId)
                .organization(testOrg)
                .createdBy(testUser)
                .name("Test Board")
                .description("Description")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        adminMember = OrgMember.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .user(testUser)
                .role(OrgRole.ADMIN)
                .build();
    }

    @Nested
    @DisplayName("Create Board")
    class CreateBoard {

        @Test
        @DisplayName("should create board successfully for org member")
        void createSuccess() {
            CreateBoardRequest request = new CreateBoardRequest("New Board", "Desc", null);

            OrgMember member = OrgMember.builder()
                    .role(OrgRole.MEMBER)
                    .build();

            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));
            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(boardRepository.save(any(Board.class))).thenAnswer(inv -> {
                Board b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(LocalDateTime.now());
                b.setUpdatedAt(LocalDateTime.now());
                return b;
            });
            when(boardMemberRepository.save(any(BoardMember.class))).thenReturn(null);
            when(boardContentRepository.save(any(BoardContent.class))).thenReturn(null);

            BoardResponse response = boardService.create(orgId, request, userId);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("New Board");
            assertThat(response.getCurrentUserRole()).isEqualTo(BoardRole.OWNER);

            verify(boardRepository).save(any(Board.class));
            verify(boardMemberRepository).save(any(BoardMember.class));
            verify(boardContentRepository).save(any(BoardContent.class));
        }

        @Test
        @DisplayName("should create board from template")
        void createFromTemplate() {
            UUID templateId = UUID.randomUUID();
            CreateBoardRequest request = new CreateBoardRequest("From Template", "Desc", templateId);

            OrgMember member = OrgMember.builder().role(OrgRole.MEMBER).build();
            BoardTemplate template = BoardTemplate.builder()
                    .id(templateId)
                    .canvasData("{\"nodes\":[]}")
                    .build();

            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));
            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(boardRepository.save(any(Board.class))).thenAnswer(inv -> {
                Board b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(LocalDateTime.now());
                b.setUpdatedAt(LocalDateTime.now());
                return b;
            });
            when(boardMemberRepository.save(any())).thenReturn(null);
            when(boardTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));
            when(boardContentRepository.save(any(BoardContent.class))).thenAnswer(inv -> {
                BoardContent c = inv.getArgument(0);
                assertThat(c.getCanvasData()).isEqualTo("{\"nodes\":[]}");
                return c;
            });

            boardService.create(orgId, request, userId);

            verify(boardTemplateRepository).findById(templateId);
        }

        @Test
        @DisplayName("should deny guest from creating boards")
        void createDeniedForGuest() {
            CreateBoardRequest request = new CreateBoardRequest("Board", null, null);

            OrgMember guest = OrgMember.builder().role(OrgRole.GUEST).build();
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(guest));

            assertThatThrownBy(() -> boardService.create(orgId, request, userId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("must be a member");
        }

        @Test
        @DisplayName("should deny non-org member from creating boards")
        void createDeniedNonMember() {
            CreateBoardRequest request = new CreateBoardRequest("Board", null, null);

            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> boardService.create(orgId, request, userId))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("List Boards")
    class ListBoards {

        @Test
        @DisplayName("should list boards for org member")
        void listSuccess() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Board> boardPage = new PageImpl<>(List.of(testBoard));

            OrgMember member = OrgMember.builder().role(OrgRole.MEMBER).build();
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));
            when(boardRepository.findByOrganizationId(orgId, pageable)).thenReturn(boardPage);
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.OWNER).build()));

            Page<BoardResponse> result = boardService.listByOrganization(orgId, null, pageable, userId);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Test Board");
        }

        @Test
        @DisplayName("should search boards by name")
        void searchBoards() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Board> boardPage = new PageImpl<>(List.of(testBoard));

            OrgMember member = OrgMember.builder().role(OrgRole.MEMBER).build();
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(member));
            when(boardRepository.searchByOrganization(orgId, "Test", pageable)).thenReturn(boardPage);
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.empty());

            Page<BoardResponse> result = boardService.listByOrganization(orgId, "Test", pageable, userId);

            assertThat(result.getContent()).hasSize(1);
            verify(boardRepository).searchByOrganization(orgId, "Test", pageable);
            verify(boardRepository, never()).findByOrganizationId(any(), any());
        }

        @Test
        @DisplayName("should deny non-member from listing")
        void listDenied() {
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> boardService.listByOrganization(orgId, null, PageRequest.of(0, 20), userId))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("Get Board")
    class GetBoard {

        @Test
        @DisplayName("should get board for org member")
        void getSuccess() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(orgMemberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(true);
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.EDITOR).build()));

            BoardResponse response = boardService.getById(boardId, userId);

            assertThat(response.getId()).isEqualTo(boardId);
            assertThat(response.getCurrentUserRole()).isEqualTo(BoardRole.EDITOR);
        }

        @Test
        @DisplayName("should throw when board not found")
        void getNotFound() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> boardService.getById(boardId, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Board not found");
        }

        @Test
        @DisplayName("should deny non-org member")
        void getDenied() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(orgMemberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(false);

            assertThatThrownBy(() -> boardService.getById(boardId, userId))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("Update Board")
    class UpdateBoard {

        @Test
        @DisplayName("should update board for owner")
        void updateAsOwner() {
            UpdateBoardRequest request = new UpdateBoardRequest("Updated Name", "New desc");

            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.OWNER).build()));
            when(boardRepository.save(any(Board.class))).thenReturn(testBoard);

            BoardResponse response = boardService.update(boardId, request, userId);

            assertThat(response).isNotNull();
            verify(boardRepository).save(any(Board.class));
        }

        @Test
        @DisplayName("should update board for editor")
        void updateAsEditor() {
            UpdateBoardRequest request = new UpdateBoardRequest("Updated", "Desc");

            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.EDITOR).build()));
            when(boardRepository.save(any(Board.class))).thenReturn(testBoard);

            boardService.update(boardId, request, userId);

            verify(boardRepository).save(any(Board.class));
        }

        @Test
        @DisplayName("should deny viewer from updating")
        void updateDeniedForViewer() {
            UpdateBoardRequest request = new UpdateBoardRequest("Updated", "Desc");

            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.VIEWER).build()));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(OrgMember.builder().role(OrgRole.MEMBER).build()));

            assertThatThrownBy(() -> boardService.update(boardId, request, userId))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("Delete Board")
    class DeleteBoard {

        @Test
        @DisplayName("should delete board as owner")
        void deleteAsOwner() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.OWNER).build()));
            when(boardContentRepository.findByBoardId(boardId)).thenReturn(Optional.empty());
            when(boardMemberRepository.findByBoardId(boardId)).thenReturn(List.of());

            boardService.delete(boardId, userId);

            verify(boardRepository).delete(testBoard);
        }

        @Test
        @DisplayName("should delete board as org admin")
        void deleteAsOrgAdmin() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.EDITOR).build()));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(OrgMember.builder().role(OrgRole.ADMIN).build()));
            when(boardContentRepository.findByBoardId(boardId)).thenReturn(Optional.empty());
            when(boardMemberRepository.findByBoardId(boardId)).thenReturn(List.of());

            boardService.delete(boardId, userId);

            verify(boardRepository).delete(testBoard);
        }

        @Test
        @DisplayName("should deny viewer from deleting")
        void deleteDenied() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.of(testBoard));
            when(boardMemberRepository.findByBoardIdAndUserId(boardId, userId))
                    .thenReturn(Optional.of(BoardMember.builder().role(BoardRole.VIEWER).build()));
            when(orgMemberRepository.findByOrganizationIdAndUserId(orgId, userId))
                    .thenReturn(Optional.of(OrgMember.builder().role(OrgRole.MEMBER).build()));

            assertThatThrownBy(() -> boardService.delete(boardId, userId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only board owner or org admin");
        }

        @Test
        @DisplayName("should throw when board not found")
        void deleteNotFound() {
            when(boardRepository.findById(boardId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> boardService.delete(boardId, userId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }
}
