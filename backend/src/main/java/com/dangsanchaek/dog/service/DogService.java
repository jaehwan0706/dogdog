package com.dangsanchaek.dog.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserWithdrawnEvent;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.dog.domain.Dog;
import com.dangsanchaek.dog.dto.DogDtos.DogCreateRequest;
import com.dangsanchaek.dog.dto.DogDtos.DogResponse;
import com.dangsanchaek.dog.dto.DogDtos.DogUpdateRequest;
import com.dangsanchaek.dog.repository.DogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DogService {

    private static final int MAX_DOGS_PER_USER = 10;

    private final DogRepository dogRepository;
    private final UserReader userReader;

    @Transactional
    public DogResponse create(Long userId, DogCreateRequest request) {
        User owner = userReader.getActiveUser(userId);
        if (dogRepository.countByOwnerId(userId) >= MAX_DOGS_PER_USER) {
            throw new BusinessException(ErrorCode.DOG_LIMIT_EXCEEDED);
        }
        Dog dog = dogRepository.save(Dog.builder()
                .owner(owner)
                .name(request.name().strip())
                .breed(request.breed())
                .gender(request.gender())
                .birthDate(request.birthDate())
                .weightKg(request.weightKg())
                .neutered(request.neutered())
                .profileImageUrl(request.profileImageUrl())
                .build());
        dogRepository.flush();
        return DogResponse.from(dog);
    }

    @Transactional(readOnly = true)
    public List<DogResponse> getMyDogs(Long userId) {
        return dogRepository.findAllByOwnerIdOrderByIdAsc(userId).stream().map(DogResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DogResponse get(Long userId, Long dogId) {
        return DogResponse.from(getOwnedDog(userId, dogId));
    }

    @Transactional
    public DogResponse update(Long userId, Long dogId, DogUpdateRequest request) {
        Dog dog = getOwnedDog(userId, dogId);
        if (request.name() != null) dog.changeName(request.name().strip());
        if (request.breed() != null) dog.changeBreed(request.breed());
        if (request.gender() != null) dog.changeGender(request.gender());
        if (request.birthDate() != null) dog.changeBirthDate(request.birthDate());
        if (request.weightKg() != null) dog.changeWeightKg(request.weightKg());
        if (request.neutered() != null) dog.changeNeutered(request.neutered());
        if (request.profileImageUrl() != null) dog.changeProfileImageUrl(request.profileImageUrl());
        dogRepository.flush();
        return DogResponse.from(dog);
    }

    @Transactional
    public void delete(Long userId, Long dogId) {
        dogRepository.delete(getOwnedDog(userId, dogId));
    }

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        dogRepository.deleteAllByOwnerId(event.userId());
    }

    /** 다른 사람의 반려견은 존재 여부도 노출하지 않도록 404 로 응답한다. */
    private Dog getOwnedDog(Long userId, Long dogId) {
        return dogRepository.findById(dogId)
                .filter(dog -> dog.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
    }
}
