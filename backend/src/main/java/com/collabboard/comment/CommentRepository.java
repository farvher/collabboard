package com.collabboard.comment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.board.id = :boardId ORDER BY c.createdAt ASC")
    List<Comment> findByBoardId(@Param("boardId") UUID boardId);

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.board.id = :boardId AND c.nodeId = :nodeId ORDER BY c.createdAt ASC")
    List<Comment> findByBoardIdAndNodeId(@Param("boardId") UUID boardId, @Param("nodeId") String nodeId);

    @Query("SELECT c.nodeId, COUNT(c) FROM Comment c WHERE c.board.id = :boardId AND c.resolved = false GROUP BY c.nodeId")
    List<Object[]> countUnresolvedByNode(@Param("boardId") UUID boardId);
}
