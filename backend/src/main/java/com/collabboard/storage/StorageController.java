package com.collabboard.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StorageController {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"
    );
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

    private final StorageService storageService;

    @PostMapping("/boards/{boardId}/images")
    public ResponseEntity<?> uploadImage(
            @PathVariable UUID boardId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        // Validate file type
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File is empty"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid file type. Allowed: PNG, JPEG, GIF, WebP, SVG"));
        }

        // Validate file size
        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File too large. Maximum size: 10MB"));
        }

        String folder = "boards/" + boardId + "/images";
        String key = storageService.upload(file, folder);
        String url = storageService.getPresignedUrl(key);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("key", key, "url", url));
    }

    @GetMapping("/storage/presigned")
    public ResponseEntity<?> getPresignedUrl(
            @RequestParam String key,
            Authentication auth) {

        String url = storageService.getPresignedUrl(key);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
