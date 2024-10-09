package com.football.backend.repositories;

import com.football.backend.wrapper.models.Team;
import org.springframework.data.repository.ListPagingAndSortingRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends ListPagingAndSortingRepository<Team, Integer> {
}
