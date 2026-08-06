package com.collabboard.board;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, UUID> {

    @Query("SELECT m FROM BoardMember m JOIN FETCH m.user WHERE m.board.id = :boardId")
    List<BoardMember> findByBoardId(@Param("boardId") UUID boardId);

    List<BoardMember> findByUserId(UUID userId);

    @Query("SELECT m FROM BoardMember m JOIN FETCH m.user JOIN FETCH m.board WHERE m.board.id = :boardId AND m.user.id = :userId")
    Optional<BoardMember> findByBoardIdAndUserId(@Param("boardId") UUID boardId, @Param("userId") UUID userId);

    boolean existsByBoardIdAndUserId(UUID boardId, UUID userId);
}
