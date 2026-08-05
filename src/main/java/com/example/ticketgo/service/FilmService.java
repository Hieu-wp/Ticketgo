package com.example.ticketgo.service;

import com.example.ticketgo.entity.Film;
import com.example.ticketgo.repository.FilmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FilmService {

    @Autowired
    private FilmRepository filmRepository;

    public Film addFilm(Film film) {
        return filmRepository.save(film);
    }

    public List<Film> getAllFilms() {
        return filmRepository.findAllByOrderByIdAsc();
    }

    public List<Film> getMoviesByCategoryId(String categoryId) {
        return filmRepository.findByCategoryId(categoryId);
    }


    public int countMoviesByCategoryId(String categoryId) {
        return filmRepository.countByCategoryId(categoryId);
    }
}