package com.football.backend.repositories;

import com.football.backend.models.Team;
import org.springframework.data.domain.Sort;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListPagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends ListPagingAndSortingRepository<Team, Integer> {
    List<Team> findAll(Sort sort);

    Team findById(Integer id);

    @Query("SELECT * FROM Team WHERE id = :teamId")
    Team findById(@Param("teamId") int teamId);

}




