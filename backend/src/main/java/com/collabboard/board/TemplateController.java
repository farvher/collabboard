package com.collabboard.board;

import com.collabboard.board.dto.TemplateResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final BoardTemplateRepository boardTemplateRepository;

    @GetMapping
    public ResponseEntity<List<TemplateResponse>> listTemplates(
            @RequestParam(required = false) UUID orgId,
            @RequestParam(required = false) String category,
            Authentication auth) {

        List<BoardTemplate> templates;
        if (orgId != null) {
            templates = boardTemplateRepository.findAvailableTemplates(orgId);
        } else {
            templates = boardTemplateRepository.findByIsGlobalTrue();
        }

        if (category != null && !category.isBlank()) {
            templates = templates.stream()
                    .filter(t -> t.getCategory().equalsIgnoreCase(category))
                    .toList();
        }

        List<TemplateResponse> response = templates.stream()
                .map(TemplateResponse::from)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateResponse> getTemplate(@PathVariable UUID id) {
        BoardTemplate template = boardTemplateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Template not found"));
        return ResponseEntity.ok(TemplateResponse.from(template));
    }
}
