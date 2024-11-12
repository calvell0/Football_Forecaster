package com.football.backend.repositories;

import com.football.backend.models.Logo;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogoRepository extends PagingAndSortingRepository<Logo, Integer> {
    public List<Logo> findAll();

    @Query("SELECT * FROM logo WHERE logo.team_id = :teamId LIMIT 1")
    public Logo findOneByTeamId(@Param("teamId")Integer teamId);
}
