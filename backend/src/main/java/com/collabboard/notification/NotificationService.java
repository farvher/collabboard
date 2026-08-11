package com.collabboard.notification;

import com.collabboard.notification.dto.NotificationResponse;
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
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ═══════════════════════════════════════════
    // Query methods
    // ═══════════════════════════════════════════

    public Page<NotificationResponse> listNotifications(UUID userId, Boolean unreadOnly, Pageable pageable) {
        Page<Notification> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = notificationRepository.findUnreadByUserId(userId, pageable);
        } else {
            page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return page.map(NotificationResponse::from);
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new EntityNotFoundException("Notification not found");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    // ═══════════════════════════════════════════
    // Create notification methods (called by other services)
    // ═══════════════════════════════════════════

    /**
     * Notify a user that a board was shared with them.
     */
    public void notifyBoardShared(UUID recipientId, String boardName, UUID boardId, String sharedByName) {
        createNotification(
                recipientId,
                NotificationType.BOARD_SHARED,
                "Board shared with you",
                sharedByName + " shared \"" + boardName + "\" with you",
                boardId
        );
    }

    /**
     * Notify board members that a comment was added.
     */
    public void notifyCommentAdded(UUID recipientId, String boardName, UUID boardId, String authorName) {
        createNotification(
                recipientId,
                NotificationType.COMMENT_ADDED,
                "New comment",
                authorName + " commented on \"" + boardName + "\"",
                boardId
        );
    }

    /**
     * Notify the comment author that their comment was resolved.
     */
    public void notifyCommentResolved(UUID recipientId, String boardName, UUID boardId, String resolvedByName) {
        createNotification(
                recipientId,
                NotificationType.COMMENT_RESOLVED,
                "Comment resolved",
                resolvedByName + " resolved your comment on \"" + boardName + "\"",
                boardId
        );
    }

    /**
     * Notify a user that they were added to an organization.
     */
    public void notifyMemberAdded(UUID recipientId, String orgName, UUID orgId, String addedByName) {
        createNotification(
                recipientId,
                NotificationType.MEMBER_ADDED,
                "Added to organization",
                addedByName + " added you to \"" + orgName + "\"",
                orgId
        );
    }

    // ═══════════════════════════════════════════
    // Internal
    // ═══════════════════════════════════════════

    private void createNotification(UUID recipientId, NotificationType type, String title, String message, UUID referenceId) {
        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) return;

        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .build();

        notificationRepository.save(notification);
    }
}
