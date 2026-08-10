package com.collabboard.integration;

import com.collabboard.AbstractIntegrationTest;
import com.collabboard.board.*;
import com.collabboard.board.dto.*;
import com.collabboard.organization.*;
import com.collabboard.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Canvas Persistence Integration Tests")
class CanvasPersistenceIntegrationTest extends AbstractIntegrationTest {

    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private OrgMemberRepository orgMemberRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private BoardMemberRepository boardMemberRepository;
    @Autowired private BoardContentRepository boardContentRepository;
    @Autowired private BoardVersionRepository boardVersionRepository;

    private User userA;
    private User userB;
    private Organization org;
    private String boardId;

    @BeforeEach
    void setUpData() throws Exception {
        userA = createTestUser("canvas-a-" + System.nanoTime() + "@test.com", "User A");
        userB = createTestUser("canvas-b-" + System.nanoTime() + "@test.com", "User B");

        org = organizationRepository.save(Organization.builder()
                .name("Canvas Org")
                .slug("canvas-org-" + System.nanoTime())
                .build());

        orgMemberRepository.save(OrgMember.builder()
                .organization(org).user(userA).role(OrgRole.ADMIN).build());
        orgMemberRepository.save(OrgMember.builder()
                .organization(org).user(userB).role(OrgRole.MEMBER).build());

        // Create a board via API
        CreateBoardRequest req = new CreateBoardRequest("Canvas Board", "For persistence tests", null);
        MvcResult result = mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                        .header("Authorization", bearerToken(userA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        BoardResponse boardResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), BoardResponse.class);
        boardId = boardResponse.getId().toString();
    }

    @Nested
    @DisplayName("GET /api/boards/{id}/content")
    class GetContent {

        @Test
        @DisplayName("should return initial empty content with version 1")
        void getInitialContent() throws Exception {
            mockMvc.perform(get("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.boardId").value(boardId))
                    .andExpect(jsonPath("$.canvasData").value("{}"))
                    .andExpect(jsonPath("$.version").value(1))
                    .andExpect(jsonPath("$.updatedAt").isNotEmpty());
        }

        @Test
        @DisplayName("non-org member cannot access content")
        void denyOutsider() throws Exception {
            User outsider = createTestUser("canvas-outsider-" + System.nanoTime() + "@test.com", "Out");

            mockMvc.perform(get("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(outsider)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/boards/{id}/content — Save with Optimistic Locking")
    class SaveContent {

        @Test
        @DisplayName("should save content and increment version")
        void saveSuccess() throws Exception {
            String canvasData = "{\"nodes\":[{\"id\":\"n1\",\"type\":\"rectangle\",\"position\":{\"x\":100,\"y\":200}}],\"edges\":[]}";
            SaveContentRequest request = new SaveContentRequest(canvasData, 1);

            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(2))
                    .andExpect(jsonPath("$.canvasData").value(canvasData))
                    .andExpect(jsonPath("$.lastSavedByName").value("User A"));
        }

        @Test
        @DisplayName("should return 409 on version conflict")
        void saveConflict() throws Exception {
            // First save (version 1 → 2)
            String data1 = "{\"nodes\":[{\"id\":\"first\"}]}";
            SaveContentRequest firstSave = new SaveContentRequest(data1, 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(firstSave)))
                    .andExpect(status().isOk());

            // Second save with stale version (expects 1, but current is 2) → 409
            String data2 = "{\"nodes\":[{\"id\":\"stale\"}]}";
            SaveContentRequest staleSave = new SaveContentRequest(data2, 1);

            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(staleSave)))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("sequential saves with correct versions succeed")
        void sequentialSaves() throws Exception {
            // Save 1 (version 1 → 2)
            SaveContentRequest save1 = new SaveContentRequest("{\"nodes\":[{\"id\":\"v2\"}]}", 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(save1)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(2));

            // Save 2 (version 2 → 3)
            SaveContentRequest save2 = new SaveContentRequest("{\"nodes\":[{\"id\":\"v3\"}]}", 2);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(save2)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(3));

            // Save 3 (version 3 → 4)
            SaveContentRequest save3 = new SaveContentRequest("{\"nodes\":[{\"id\":\"v4\"}]}", 3);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(save3)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(4))
                    .andExpect(jsonPath("$.lastSavedByName").value("User B"));
        }

        @Test
        @DisplayName("save should create version snapshot automatically")
        void saveCreatesVersionSnapshot() throws Exception {
            SaveContentRequest request = new SaveContentRequest("{\"nodes\":[{\"id\":\"snap\"}]}", 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Verify version was created
            mockMvc.perform(get("/api/boards/" + boardId + "/versions")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].versionNumber").value(2))
                    .andExpect(jsonPath("$.content[0].savedByName").value("User A"));
        }
    }

    @Nested
    @DisplayName("PUT /api/boards/{id}/content/force — Force Save")
    class ForceSave {

        @Test
        @DisplayName("force save bypasses version check")
        void forceSaveSuccess() throws Exception {
            // First save normally (version 1 → 2)
            SaveContentRequest normalSave = new SaveContentRequest("{\"nodes\":[]}", 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(normalSave)))
                    .andExpect(status().isOk());

            // Force save (no version check)
            String forceBody = objectMapper.writeValueAsString(
                    java.util.Map.of("canvasData", "{\"nodes\":[{\"id\":\"forced\"}]}"));

            mockMvc.perform(put("/api/boards/" + boardId + "/content/force")
                            .header("Authorization", bearerToken(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(forceBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(3))
                    .andExpect(jsonPath("$.canvasData").value("{\"nodes\":[{\"id\":\"forced\"}]}"))
                    .andExpect(jsonPath("$.lastSavedByName").value("User B"));
        }
    }

    @Nested
    @DisplayName("GET /api/boards/{id}/content/version — Lightweight Version Check")
    class VersionEndpoint {

        @Test
        @DisplayName("should return current version info")
        void getVersionInfo() throws Exception {
            mockMvc.perform(get("/api/boards/" + boardId + "/content/version")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(1))
                    .andExpect(jsonPath("$.updatedAt").isNotEmpty());
        }

        @Test
        @DisplayName("should reflect version after save")
        void versionUpdatesAfterSave() throws Exception {
            SaveContentRequest request = new SaveContentRequest("{\"nodes\":[]}", 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/boards/" + boardId + "/content/version")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(2))
                    .andExpect(jsonPath("$.lastSavedBy").value("User A"));
        }
    }

    @Nested
    @DisplayName("Version History & Restore")
    class VersionHistory {

        @Test
        @DisplayName("should list version history")
        void listVersions() throws Exception {
            // Make 3 saves
            for (int i = 1; i <= 3; i++) {
                SaveContentRequest req = new SaveContentRequest("{\"v\":" + i + "}", i);
                mockMvc.perform(put("/api/boards/" + boardId + "/content")
                                .header("Authorization", bearerToken(userA))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                        .andExpect(status().isOk());
            }

            mockMvc.perform(get("/api/boards/" + boardId + "/versions")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(3)))
                    .andExpect(jsonPath("$.content[0].versionNumber").value(4)) // Newest first
                    .andExpect(jsonPath("$.content[2].versionNumber").value(2));
        }

        @Test
        @DisplayName("should restore a previous version")
        void restoreVersion() throws Exception {
            // Save version 2 with specific data
            String v2Data = "{\"nodes\":[{\"id\":\"restore-me\"}]}";
            SaveContentRequest save1 = new SaveContentRequest(v2Data, 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(save1)))
                    .andExpect(status().isOk());

            // Save version 3 with different data
            String v3Data = "{\"nodes\":[{\"id\":\"newer\"}]}";
            SaveContentRequest save2 = new SaveContentRequest(v3Data, 2);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(save2)))
                    .andExpect(status().isOk());

            // Get the version ID for version 2
            MvcResult versionsResult = mockMvc.perform(get("/api/boards/" + boardId + "/versions")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andReturn();

            var versionsJson = objectMapper.readTree(versionsResult.getResponse().getContentAsString());
            // Versions are ordered DESC, so last item is version 2
            String versionIdToRestore = versionsJson.get("content").get(1).get("id").asText();

            // Restore version 2
            mockMvc.perform(post("/api/boards/" + boardId + "/versions/" + versionIdToRestore + "/restore")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.canvasData").value(v2Data))
                    .andExpect(jsonPath("$.version").value(4)); // Restore increments version

            // Verify current content is the restored version
            mockMvc.perform(get("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.canvasData").value(v2Data))
                    .andExpect(jsonPath("$.version").value(4));
        }

        @Test
        @DisplayName("should get a specific version with snapshot data")
        void getSpecificVersion() throws Exception {
            String data = "{\"nodes\":[{\"id\":\"specific\"}]}";
            SaveContentRequest save = new SaveContentRequest(data, 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(save)))
                    .andExpect(status().isOk());

            // Get version list
            MvcResult versionsResult = mockMvc.perform(get("/api/boards/" + boardId + "/versions")
                            .header("Authorization", bearerToken(userA)))
                    .andReturn();

            var versionId = objectMapper.readTree(versionsResult.getResponse().getContentAsString())
                    .get("content").get(0).get("id").asText();

            // Get specific version (includes snapshot)
            mockMvc.perform(get("/api/boards/" + boardId + "/versions/" + versionId)
                            .header("Authorization", bearerToken(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.canvasSnapshot").value(data))
                    .andExpect(jsonPath("$.versionNumber").value(2))
                    .andExpect(jsonPath("$.savedByName").value("User A"));
        }
    }
}
