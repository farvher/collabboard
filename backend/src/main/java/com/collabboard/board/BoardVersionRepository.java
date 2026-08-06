package com.collabboard.board;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardVersionRepository extends JpaRepository<BoardVersion, UUID> {

    @Query("SELECT v FROM BoardVersion v JOIN FETCH v.savedBy WHERE v.board.id = :boardId ORDER BY v.versionNumber DESC")
    Page<BoardVersion> findByBoardIdOrderByVersionNumberDesc(@Param("boardId") UUID boardId, Pageable pageable);

    @Query("SELECT v FROM BoardVersion v JOIN FETCH v.savedBy JOIN FETCH v.board WHERE v.id = :id")
    Optional<BoardVersion> findById(@Param("id") UUID id);

    long countByBoardId(UUID boardId);
}
