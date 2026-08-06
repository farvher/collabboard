package com.collabboard.board;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardTemplateRepository extends JpaRepository<BoardTemplate, UUID> {

    @Query("SELECT t FROM BoardTemplate t WHERE t.isGlobal = true OR t.organization.id = :orgId ORDER BY t.category, t.name")
    List<BoardTemplate> findAvailableTemplates(@Param("orgId") UUID orgId);

    List<BoardTemplate> findByCategory(String category);

    List<BoardTemplate> findByIsGlobalTrue();
}
