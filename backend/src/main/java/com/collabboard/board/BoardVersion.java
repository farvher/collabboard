package com.collabboard.board;

import com.collabboard.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "board_versions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"board_id", "version_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_by", nullable = false)
    private User savedBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "canvas_snapshot", nullable = false, columnDefinition = "jsonb")
    private String canvasSnapshot;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
