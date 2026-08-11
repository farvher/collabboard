package com.collabboard.board;

import com.collabboard.organization.AccessDeniedException;
import com.collabboard.organization.OrgMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orgs/{orgId}/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final BoardContentRepository boardContentRepository;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(
            @PathVariable UUID orgId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        // Verify access
        if (!orgMemberRepository.existsByOrganizationIdAndUserId(orgId, userId)) {
            throw new AccessDeniedException("You are not a member of this organization");
        }

        // Get all boards for this org
        var allBoards = boardRepository.findByOrganizationId(orgId, org.springframework.data.domain.Pageable.unpaged());
        var boardList = allBoards.getContent();

        // Total boards
        long totalBoards = boardList.size();

        // Total members
        long totalMembers = orgMemberRepository.findByOrganizationId(orgId).size();

        // Active boards (updated in last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long activeBoards = boardList.stream()
                .filter(b -> b.getUpdatedAt() != null && b.getUpdatedAt().isAfter(weekAgo))
                .count();

        // Recent boards (last 5 updated)
        List<RecentBoard> recentBoards = boardList.stream()
                .sorted(Comparator.comparing(Board::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(b -> new RecentBoard(
                        b.getId(),
                        b.getName(),
                        b.getDescription(),
                        b.getCreatedBy().getDisplayName(),
                        b.getUpdatedAt()
                ))
                .toList();

        // Activity (last 10 boards created or updated in 30 days)
        LocalDateTime monthAgo = LocalDateTime.now().minusDays(30);
        List<ActivityItem> recentActivity = boardList.stream()
                .filter(b -> b.getUpdatedAt() != null && b.getUpdatedAt().isAfter(monthAgo))
                .sorted(Comparator.comparing(Board::getUpdatedAt, Comparator.reverseOrder()))
                .limit(10)
                .map(b -> {
                    boolean isNew = b.getCreatedAt() != null && b.getCreatedAt().isAfter(weekAgo);
                    return new ActivityItem(
                            b.getId(),
                            b.getName(),
                            b.getCreatedBy().getDisplayName(),
                            isNew ? "created" : "updated",
                            b.getUpdatedAt()
                    );
                })
                .toList();

        // Boards per day (last 7 days activity count)
        Map<String, Long> activityByDay = boardList.stream()
                .filter(b -> b.getUpdatedAt() != null && b.getUpdatedAt().isAfter(weekAgo))
                .collect(Collectors.groupingBy(
                        b -> b.getUpdatedAt().toLocalDate().toString(),
                        Collectors.counting()
                ));

        var response = new DashboardResponse(
                totalBoards,
                totalMembers,
                activeBoards,
                recentBoards,
                recentActivity,
                activityByDay
        );

        return ResponseEntity.ok(response);
    }

    public record DashboardResponse(
            long totalBoards,
            long totalMembers,
            long activeBoards,
            List<RecentBoard> recentBoards,
            List<ActivityItem> recentActivity,
            Map<String, Long> activityByDay
    ) {}

    public record RecentBoard(
            UUID id,
            String name,
            String description,
            String createdByName,
            LocalDateTime updatedAt
    ) {}

    public record ActivityItem(
            UUID id,
            String boardName,
            String userName,
            String action,
            LocalDateTime timestamp
    ) {}
}
