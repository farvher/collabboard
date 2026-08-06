package com.collabboard.board;

import com.collabboard.organization.AccessDeniedException;
import com.collabboard.organization.OrgMemberRepository;
import com.collabboard.storage.StorageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/export")
@RequiredArgsConstructor
@Slf4j
public class ExportController {

    private final BoardContentRepository boardContentRepository;
    private final BoardRepository boardRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<?> exportBoard(
            @PathVariable UUID boardId,
            @RequestParam(defaultValue = "pdf") String format,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        verifyAccess(boardId, userId);

        BoardContent content = boardContentRepository.findByBoardId(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board content not found"));

        if ("pdf".equalsIgnoreCase(format)) {
            return exportPdf(boardId, content);
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Unsupported format: " + format));
    }

    private ResponseEntity<?> exportPdf(UUID boardId, BoardContent content) {
        try {
            byte[] pdfBytes = generatePdf(content.getCanvasData());

            // Store in MinIO
            String key = "boards/" + boardId + "/exports/" + System.currentTimeMillis() + ".pdf";
            storageService.uploadBytes(pdfBytes, key, "application/pdf");
            String url = storageService.getPresignedUrl(key);

            return ResponseEntity.ok(Map.of(
                    "key", key,
                    "url", url,
                    "format", "pdf",
                    "size", pdfBytes.length
            ));
        } catch (Exception e) {
            log.error("PDF export failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "PDF export failed: " + e.getMessage()));
        }
    }

    private byte[] generatePdf(String canvasDataJson) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        PdfWriter writer = PdfWriter.getInstance(document, baos);
        document.open();

        PdfContentByte canvas = writer.getDirectContent();

        // Parse canvas data
        JsonNode canvasData = objectMapper.readTree(canvasDataJson);
        JsonNode nodes = canvasData.get("nodes");

        if (nodes == null || !nodes.isArray() || nodes.isEmpty()) {
            // Empty canvas - add a message
            document.add(new Paragraph("Empty Board", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24)));
            document.add(new Paragraph("This board has no content yet."));
        } else {
            // Add title
            document.add(new Paragraph("Board Export", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(" "));

            // Calculate bounds for scaling
            float minX = Float.MAX_VALUE, minY = Float.MAX_VALUE;
            float maxX = Float.MIN_VALUE, maxY = Float.MIN_VALUE;

            for (JsonNode node : nodes) {
                JsonNode pos = node.get("position");
                if (pos != null) {
                    float x = (float) pos.get("x").asDouble();
                    float y = (float) pos.get("y").asDouble();
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x + 150);
                    maxY = Math.max(maxY, y + 80);
                }
            }

            float canvasWidth = maxX - minX;
            float canvasHeight = maxY - minY;

            // Available area on page
            float pageWidth = document.getPageSize().getWidth() - 72;
            float pageHeight = document.getPageSize().getHeight() - 120;

            float scale = Math.min(pageWidth / Math.max(canvasWidth, 1), pageHeight / Math.max(canvasHeight, 1));
            scale = Math.min(scale, 1.5f); // Don't scale up too much

            float offsetX = 36;
            float offsetY = document.getPageSize().getHeight() - 80;

            // Draw nodes
            for (JsonNode node : nodes) {
                JsonNode pos = node.get("position");
                JsonNode data = node.get("data");
                String type = node.has("type") ? node.get("type").asText() : "rectangle";

                if (pos == null) continue;

                float x = ((float) pos.get("x").asDouble() - minX) * scale + offsetX;
                float y = offsetY - ((float) pos.get("y").asDouble() - minY) * scale;

                float w = 120 * scale;
                float h = 60 * scale;

                String label = "";
                if (data != null && data.has("label")) {
                    label = data.get("label").asText();
                }

                // Draw shape
                canvas.setLineWidth(1f);
                canvas.setColorStroke(new Color(100, 100, 100));

                switch (type) {
                    case "circle" -> {
                        float r = Math.min(w, h) / 2;
                        canvas.setColorFill(new Color(235, 245, 255));
                        canvas.circle(x + w / 2, y - h / 2, r);
                        canvas.fillStroke();
                    }
                    case "diamond" -> {
                        canvas.setColorFill(new Color(255, 250, 230));
                        canvas.moveTo(x + w / 2, y);
                        canvas.lineTo(x + w, y - h / 2);
                        canvas.lineTo(x + w / 2, y - h);
                        canvas.lineTo(x, y - h / 2);
                        canvas.closePath();
                        canvas.fillStroke();
                    }
                    case "stickyNote" -> {
                        canvas.setColorFill(new Color(254, 240, 138));
                        canvas.rectangle(x, y - h, w, h);
                        canvas.fillStroke();
                    }
                    default -> {
                        canvas.setColorFill(new Color(255, 255, 255));
                        canvas.rectangle(x, y - h, w, h);
                        canvas.fillStroke();
                    }
                }

                // Draw label
                if (!label.isEmpty()) {
                    canvas.beginText();
                    canvas.setFontAndSize(FontFactory.getFont(FontFactory.HELVETICA).getCalculatedBaseFont(false), 9 * scale);
                    canvas.setColorFill(new Color(30, 30, 30));
                    float textX = x + 5 * scale;
                    float textY = y - h / 2 - 4 * scale;
                    canvas.setTextMatrix(textX, textY);
                    canvas.showText(label.length() > 20 ? label.substring(0, 20) + "..." : label);
                    canvas.endText();
                }
            }

            // Draw edges
            JsonNode edges = canvasData.get("edges");
            if (edges != null && edges.isArray()) {
                canvas.setColorStroke(new Color(150, 150, 150));
                canvas.setLineWidth(0.8f);
                for (JsonNode edge : edges) {
                    String sourceId = edge.has("source") ? edge.get("source").asText() : "";
                    String targetId = edge.has("target") ? edge.get("target").asText() : "";

                    JsonNode sourceNode = findNodeById(nodes, sourceId);
                    JsonNode targetNode = findNodeById(nodes, targetId);

                    if (sourceNode != null && targetNode != null) {
                        JsonNode sp = sourceNode.get("position");
                        JsonNode tp = targetNode.get("position");

                        float sx = ((float) sp.get("x").asDouble() - minX) * scale + offsetX + 60 * scale;
                        float sy = offsetY - ((float) sp.get("y").asDouble() - minY) * scale - 30 * scale;
                        float tx = ((float) tp.get("x").asDouble() - minX) * scale + offsetX + 60 * scale;
                        float ty = offsetY - ((float) tp.get("y").asDouble() - minY) * scale - 30 * scale;

                        canvas.moveTo(sx, sy);
                        canvas.lineTo(tx, ty);
                        canvas.stroke();
                    }
                }
            }
        }

        document.close();
        return baos.toByteArray();
    }

    private JsonNode findNodeById(JsonNode nodes, String id) {
        for (JsonNode node : nodes) {
            if (node.has("id") && node.get("id").asText().equals(id)) {
                return node;
            }
        }
        return null;
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
}
