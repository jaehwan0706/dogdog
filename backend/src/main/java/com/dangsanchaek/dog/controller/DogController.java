package com.dangsanchaek.dog.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.dog.dto.DogDtos.DogCreateRequest;
import com.dangsanchaek.dog.dto.DogDtos.DogResponse;
import com.dangsanchaek.dog.dto.DogDtos.DogUpdateRequest;
import com.dangsanchaek.dog.service.DogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dogs")
@RequiredArgsConstructor
public class DogController {

    private final DogService dogService;

    @PostMapping
    public ResponseEntity<DogResponse> create(@LoginUser Long userId, @Valid @RequestBody DogCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dogService.create(userId, request));
    }

    /** 내 반려견 목록 */
    @GetMapping
    public List<DogResponse> myDogs(@LoginUser Long userId) {
        return dogService.getMyDogs(userId);
    }

    @GetMapping("/{dogId}")
    public DogResponse get(@LoginUser Long userId, @PathVariable Long dogId) {
        return dogService.get(userId, dogId);
    }

    @PatchMapping("/{dogId}")
    public DogResponse update(@LoginUser Long userId, @PathVariable Long dogId,
                              @Valid @RequestBody DogUpdateRequest request) {
        return dogService.update(userId, dogId, request);
    }

    @DeleteMapping("/{dogId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long dogId) {
        dogService.delete(userId, dogId);
        return ResponseEntity.noContent().build();
    }
}
