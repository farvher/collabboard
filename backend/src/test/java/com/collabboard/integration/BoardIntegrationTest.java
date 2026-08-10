package com.collabboard.integration;

import com.collabboard.AbstractIntegrationTest;
import com.collabboard.board.*;
import com.collabboard.board.dto.*;
import com.collabboard.organization.*;
import com.collabboard.organization.dto.CreateOrgRequest;
import com.collabboard.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Board Integration Tests")
class BoardIntegrationTest extends AbstractIntegrationTest {

    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private OrgMemberRepository orgMemberRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private BoardMemberRepository boardMemberRepository;

    private User owner;
    private User member;
    private User outsider;
    private Organization org;

    @BeforeEach
    void setUpData() {
        owner = createTestUser("board-owner-" + System.nanoTime() + "@test.com", "Board Owner");
        member = createTestUser("board-member-" + System.nanoTime() + "@test.com", "Board Member");
        outsider = createTestUser("board-outsider-" + System.nanoTime() + "@test.com", "Outsider");

        org = Organization.builder()
                .name("Board Test Org")
                .slug("board-test-org-" + System.nanoTime())
                .build();
        org = organizationRepository.save(org);

        // Owner is ADMIN in org
        orgMemberRepository.save(OrgMember.builder()
                .organization(org)
                .user(owner)
                .role(OrgRole.ADMIN)
                .build());

        // Member is MEMBER in org
        orgMemberRepository.save(OrgMember.builder()
                .organization(org)
                .user(member)
                .role(OrgRole.MEMBER)
                .build());
    }

    @Nested
    @DisplayName("POST /api/orgs/{orgId}/boards")
    class CreateBoard {

        @Test
        @DisplayName("should create board and assign OWNER role")
        void createSuccess() throws Exception {
            CreateBoardRequest request = new CreateBoardRequest("My Board", "A test board", null);

            mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                            .header("Authorization", bearerToken(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("My Board"))
                    .andExpect(jsonPath("$.description").value("A test board"))
                    .andExpect(jsonPath("$.currentUserRole").value("OWNER"))
                    .andExpect(jsonPath("$.orgId").value(org.getId().toString()));
        }

        @Test
        @DisplayName("org member (MEMBER role) can create boards")
        void memberCanCreate() throws Exception {
            CreateBoardRequest request = new CreateBoardRequest("Member Board", null, null);

            mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                            .header("Authorization", bearerToken(member))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.currentUserRole").value("OWNER"));
        }

        @Test
        @DisplayName("non-org member cannot create boards")
        void outsiderCannotCreate() throws Exception {
            CreateBoardRequest request = new CreateBoardRequest("Blocked Board", null, null);

            mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                            .header("Authorization", bearerToken(outsider))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should reject blank board name")
        void createBlankName() throws Exception {
            CreateBoardRequest request = new CreateBoardRequest("", null, null);

            mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                            .header("Authorization", bearerToken(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/orgs/{orgId}/boards")
    class ListBoards {

        @Test
        @DisplayName("should list boards for org member")
        void listSuccess() throws Exception {
            // Create a board first
            createBoard("Listed Board");

            mockMvc.perform(get("/api/orgs/" + org.getId() + "/boards")
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.content[0].name").isNotEmpty());
        }

        @Test
        @DisplayName("should search boards by name")
        void searchBoards() throws Exception {
            createBoard("Alpha Board");
            createBoard("Beta Board");

            mockMvc.perform(get("/api/orgs/" + org.getId() + "/boards")
                            .param("search", "Alpha")
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[*].name", hasItem("Alpha Board")))
                    .andExpect(jsonPath("$.content[*].name", not(hasItem("Beta Board"))));
        }

        @Test
        @DisplayName("should paginate results")
        void pagination() throws Exception {
            for (int i = 0; i < 3; i++) {
                createBoard("Page Board " + i);
            }

            mockMvc.perform(get("/api/orgs/" + org.getId() + "/boards")
                            .param("size", "2")
                            .param("page", "0")
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(3)));
        }

        @Test
        @DisplayName("non-member cannot list boards")
        void outsiderCannotList() throws Exception {
            mockMvc.perform(get("/api/orgs/" + org.getId() + "/boards")
                            .header("Authorization", bearerToken(outsider)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/boards/{id}")
    class GetBoard {

        @Test
        @DisplayName("should get board by id for org member")
        void getSuccess() throws Exception {
            String boardId = createBoard("Get Board");

            mockMvc.perform(get("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Get Board"))
                    .andExpect(jsonPath("$.id").value(boardId));
        }

        @Test
        @DisplayName("should return 404 for non-existent board")
        void getNotFound() throws Exception {
            mockMvc.perform(get("/api/boards/" + java.util.UUID.randomUUID())
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("non-org member cannot access board")
        void outsiderCannotGet() throws Exception {
            String boardId = createBoard("Private Board");

            mockMvc.perform(get("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(outsider)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/boards/{id}")
    class UpdateBoard {

        @Test
        @DisplayName("board owner can update")
        void updateAsOwner() throws Exception {
            String boardId = createBoard("Original Name");
            UpdateBoardRequest request = new UpdateBoardRequest("Updated Name", "New desc");

            mockMvc.perform(put("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"));
        }

        @Test
        @DisplayName("org admin can update any board")
        void updateAsOrgAdmin() throws Exception {
            // Member creates a board, owner (org admin) can update it
            String boardId = createBoardAsUser(member, "Member's Board");
            UpdateBoardRequest request = new UpdateBoardRequest("Admin Updated", "By admin");

            mockMvc.perform(put("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Admin Updated"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/boards/{id}")
    class DeleteBoard {

        @Test
        @DisplayName("board owner can delete")
        void deleteAsOwner() throws Exception {
            String boardId = createBoard("To Delete");

            mockMvc.perform(delete("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isNoContent());

            // Verify it's gone
            mockMvc.perform(get("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("org admin can delete any board")
        void deleteAsOrgAdmin() throws Exception {
            String boardId = createBoardAsUser(member, "Member Board To Delete");

            mockMvc.perform(delete("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("viewer cannot delete board")
        void viewerCannotDelete() throws Exception {
            String boardId = createBoard("Protected Board");

            // Add outsider to org as GUEST, then as board VIEWER
            orgMemberRepository.save(OrgMember.builder()
                    .organization(org)
                    .user(outsider)
                    .role(OrgRole.GUEST)
                    .build());

            Board board = boardRepository.findById(java.util.UUID.fromString(boardId)).orElseThrow();
            boardMemberRepository.save(BoardMember.builder()
                    .board(board)
                    .user(outsider)
                    .role(BoardRole.VIEWER)
                    .build());

            mockMvc.perform(delete("/api/boards/" + boardId)
                            .header("Authorization", bearerToken(outsider)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Board Members")
    class BoardMembers {

        @Test
        @DisplayName("should add member to board")
        void addMember() throws Exception {
            String boardId = createBoard("Shared Board");
            AddBoardMemberRequest request = new AddBoardMemberRequest(member.getEmail(), BoardRole.EDITOR);

            mockMvc.perform(post("/api/boards/" + boardId + "/members")
                            .header("Authorization", bearerToken(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.email").value(member.getEmail()))
                    .andExpect(jsonPath("$.role").value("EDITOR"));
        }

        @Test
        @DisplayName("should list board members")
        void listMembers() throws Exception {
            String boardId = createBoard("Members Board");

            mockMvc.perform(get("/api/boards/" + boardId + "/members")
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].role").value("OWNER"));
        }

        @Test
        @DisplayName("should remove member from board")
        void removeMember() throws Exception {
            String boardId = createBoard("Remove Test Board");

            // Add member first
            AddBoardMemberRequest addReq = new AddBoardMemberRequest(member.getEmail(), BoardRole.EDITOR);
            mockMvc.perform(post("/api/boards/" + boardId + "/members")
                            .header("Authorization", bearerToken(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(addReq)))
                    .andExpect(status().isCreated());

            // Remove member
            mockMvc.perform(delete("/api/boards/" + boardId + "/members/" + member.getId())
                            .header("Authorization", bearerToken(owner)))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("non-owner cannot add members")
        void nonOwnerCannotAdd() throws Exception {
            String boardId = createBoardAsUser(member, "Member Owned Board");
            AddBoardMemberRequest request = new AddBoardMemberRequest(outsider.getEmail(), BoardRole.VIEWER);

            // outsider is not the owner of this board
            mockMvc.perform(post("/api/boards/" + boardId + "/members")
                            .header("Authorization", bearerToken(outsider))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    // ========== Helpers ==========

    private String createBoard(String name) throws Exception {
        return createBoardAsUser(owner, name);
    }

    private String createBoardAsUser(User user, String name) throws Exception {
        CreateBoardRequest request = new CreateBoardRequest(name, "Test description", null);

        MvcResult result = mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                        .header("Authorization", bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        BoardResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), BoardResponse.class);
        return response.getId().toString();
    }
}
