package com.collabboard.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /**
     * Search users by email or display name (for adding members to orgs/boards).
     * Minimum 2 characters required.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> results = userRepository.searchByEmailOrName(q.trim())
                .stream()
                .limit(10)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "displayName", u.getDisplayName() != null ? u.getDisplayName() : ""
                ))
                .toList();

        return ResponseEntity.ok(results);
    }
}
