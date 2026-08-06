package com.collabboard.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrgMemberRepository extends JpaRepository<OrgMember, UUID> {

    @Query("SELECT m FROM OrgMember m JOIN FETCH m.organization JOIN FETCH m.user WHERE m.user.id = :userId")
    List<OrgMember> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM OrgMember m JOIN FETCH m.user WHERE m.organization.id = :orgId")
    List<OrgMember> findByOrganizationId(@Param("orgId") UUID orgId);

    @Query("SELECT m FROM OrgMember m JOIN FETCH m.organization JOIN FETCH m.user WHERE m.organization.id = :orgId AND m.user.id = :userId")
    Optional<OrgMember> findByOrganizationIdAndUserId(@Param("orgId") UUID orgId, @Param("userId") UUID userId);

    boolean existsByOrganizationIdAndUserId(UUID orgId, UUID userId);
}
