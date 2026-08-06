package com.collabboard.board;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardContentRepository extends JpaRepository<BoardContent, UUID> {

    @Query("SELECT c FROM BoardContent c JOIN FETCH c.board b JOIN FETCH b.organization LEFT JOIN FETCH c.lastSavedBy WHERE c.board.id = :boardId")
    Optional<BoardContent> findByBoardId(@Param("boardId") UUID boardId);
}
