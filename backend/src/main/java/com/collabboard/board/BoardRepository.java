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
public interface BoardRepository extends JpaRepository<Board, UUID> {

    @Query("SELECT b FROM Board b JOIN FETCH b.createdBy JOIN FETCH b.organization WHERE b.organization.id = :orgId")
    Page<Board> findByOrganizationId(@Param("orgId") UUID orgId, Pageable pageable);

    @Query("SELECT b FROM Board b JOIN FETCH b.createdBy JOIN FETCH b.organization WHERE b.organization.id = :orgId " +
           "AND (LOWER(b.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Board> searchByOrganization(@Param("orgId") UUID orgId,
                                     @Param("search") String search,
                                     Pageable pageable);

    @Query("SELECT b FROM Board b JOIN FETCH b.createdBy JOIN FETCH b.organization WHERE b.id = :id")
    Optional<Board> findById(@Param("id") UUID id);
}
