package com.football.backend.repositories;

import com.football.backend.models.NFLEvent;
import org.springframework.data.repository.ListPagingAndSortingRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NFLEventRepository extends ListPagingAndSortingRepository<NFLEvent, Integer> {
    NFLEvent findById(Integer id);
}
