package com.collabboard.integration;

import com.collabboard.AbstractIntegrationTest;
import com.collabboard.board.*;
import com.collabboard.board.dto.BoardResponse;
import com.collabboard.board.dto.CreateBoardRequest;
import com.collabboard.board.dto.SaveContentRequest;
import com.collabboard.organization.*;
import com.collabboard.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Storage/MinIO Integration Tests")
class StorageIntegrationTest extends AbstractIntegrationTest {

    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private OrgMemberRepository orgMemberRepository;

    private User user;
    private Organization org;
    private String boardId;

    @BeforeEach
    void setUpData() throws Exception {
        user = createTestUser("storage-" + System.nanoTime() + "@test.com", "Storage User");

        org = organizationRepository.save(Organization.builder()
                .name("Storage Org")
                .slug("storage-org-" + System.nanoTime())
                .build());

        orgMemberRepository.save(OrgMember.builder()
                .organization(org).user(user).role(OrgRole.ADMIN).build());

        // Create a board
        CreateBoardRequest req = new CreateBoardRequest("Storage Board", null, null);
        MvcResult result = mockMvc.perform(post("/api/orgs/" + org.getId() + "/boards")
                        .header("Authorization", bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        BoardResponse boardResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), BoardResponse.class);
        boardId = boardResponse.getId().toString();
    }

    @Nested
    @DisplayName("POST /api/boards/{boardId}/images — Image Upload")
    class ImageUpload {

        @Test
        @DisplayName("should upload PNG image successfully")
        void uploadPng() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test-image.png",
                    "image/png",
                    createFakeImageBytes());

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.key").value(containsString("boards/" + boardId + "/images/")))
                    .andExpect(jsonPath("$.key").value(containsString(".png")))
                    .andExpect(jsonPath("$.url").isNotEmpty());
        }

        @Test
        @DisplayName("should upload JPEG image successfully")
        void uploadJpeg() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "photo.jpg",
                    "image/jpeg",
                    createFakeImageBytes());

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.key").value(containsString(".jpg")));
        }

        @Test
        @DisplayName("should upload WebP image successfully")
        void uploadWebp() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "image.webp",
                    "image/webp",
                    createFakeImageBytes());

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.key").value(containsString(".webp")));
        }

        @Test
        @DisplayName("should upload SVG image successfully")
        void uploadSvg() throws Exception {
            String svgContent = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"40\"/></svg>";
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "icon.svg",
                    "image/svg+xml",
                    svgContent.getBytes());

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.key").value(containsString(".svg")));
        }

        @Test
        @DisplayName("should reject unsupported file type")
        void rejectUnsupportedType() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "document.pdf",
                    "application/pdf",
                    "fake pdf content".getBytes());

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("Invalid file type")));
        }

        @Test
        @DisplayName("should reject empty file")
        void rejectEmptyFile() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "empty.png",
                    "image/png",
                    new byte[0]);

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("empty")));
        }

        @Test
        @DisplayName("should reject file exceeding 10MB")
        void rejectOversizedFile() throws Exception {
            // Create a file just over 10MB
            byte[] largeContent = new byte[10 * 1024 * 1024 + 1];
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "large.png",
                    "image/png",
                    largeContent);

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("too large")));
        }

        @Test
        @DisplayName("unauthenticated user cannot upload")
        void unauthenticatedCannotUpload() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.png",
                    "image/png",
                    createFakeImageBytes());

            mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/storage/presigned — Presigned URL")
    class PresignedUrl {

        @Test
        @DisplayName("should generate presigned URL for uploaded file")
        void presignedUrlSuccess() throws Exception {
            // First upload a file
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "presigned-test.png",
                    "image/png",
                    createFakeImageBytes());

            MvcResult uploadResult = mockMvc.perform(multipart("/api/boards/" + boardId + "/images")
                            .file(file)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isCreated())
                    .andReturn();

            String key = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                    .get("key").asText();

            // Get presigned URL
            mockMvc.perform(get("/api/storage/presigned")
                            .param("key", key)
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.url").isNotEmpty())
                    .andExpect(jsonPath("$.url").value(containsString(key)));
        }

        @Test
        @DisplayName("unauthenticated user cannot get presigned URL")
        void unauthenticatedDenied() throws Exception {
            mockMvc.perform(get("/api/storage/presigned")
                            .param("key", "some/key.png"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/boards/{boardId}/export — PDF Export")
    class PdfExport {

        @Test
        @DisplayName("should export board as PDF")
        void exportPdfSuccess() throws Exception {
            // Save some content first
            String canvasData = "{\"nodes\":[{\"id\":\"n1\",\"type\":\"rectangle\",\"position\":{\"x\":100,\"y\":100},\"data\":{\"label\":\"Hello\"}}],\"edges\":[]}";
            SaveContentRequest saveReq = new SaveContentRequest(canvasData, 1);
            mockMvc.perform(put("/api/boards/" + boardId + "/content")
                            .header("Authorization", bearerToken(user))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(saveReq)))
                    .andExpect(status().isOk());

            // Export as PDF
            mockMvc.perform(post("/api/boards/" + boardId + "/export")
                            .param("format", "pdf")
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.key").value(containsString("boards/" + boardId + "/exports/")))
                    .andExpect(jsonPath("$.key").value(containsString(".pdf")))
                    .andExpect(jsonPath("$.url").isNotEmpty())
                    .andExpect(jsonPath("$.format").value("pdf"))
                    .andExpect(jsonPath("$.size").value(greaterThan(0)));
        }

        @Test
        @DisplayName("should export empty board as PDF")
        void exportEmptyBoard() throws Exception {
            mockMvc.perform(post("/api/boards/" + boardId + "/export")
                            .param("format", "pdf")
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.format").value("pdf"))
                    .andExpect(jsonPath("$.size").value(greaterThan(0)));
        }

        @Test
        @DisplayName("should reject unsupported export format")
        void rejectUnsupportedFormat() throws Exception {
            mockMvc.perform(post("/api/boards/" + boardId + "/export")
                            .param("format", "docx")
                            .header("Authorization", bearerToken(user)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("Unsupported format")));
        }

        @Test
        @DisplayName("non-org member cannot export")
        void outsiderCannotExport() throws Exception {
            User outsider = createTestUser("export-outsider-" + System.nanoTime() + "@test.com", "Out");

            mockMvc.perform(post("/api/boards/" + boardId + "/export")
                            .param("format", "pdf")
                            .header("Authorization", bearerToken(outsider)))
                    .andExpect(status().isForbidden());
        }
    }

    // ========== Helper ==========

    private byte[] createFakeImageBytes() {
        // Minimal valid PNG header (8 bytes) + some content
        // This isn't a real image but passes the content-type check
        byte[] fakeImage = new byte[256];
        // PNG magic bytes
        fakeImage[0] = (byte) 0x89;
        fakeImage[1] = 0x50; // P
        fakeImage[2] = 0x4E; // N
        fakeImage[3] = 0x47; // G
        fakeImage[4] = 0x0D;
        fakeImage[5] = 0x0A;
        fakeImage[6] = 0x1A;
        fakeImage[7] = 0x0A;
        return fakeImage;
    }
}
