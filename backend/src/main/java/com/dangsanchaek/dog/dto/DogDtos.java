package com.dangsanchaek.dog.dto;

import com.dangsanchaek.dog.domain.Dog;
import com.dangsanchaek.dog.domain.DogGender;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class DogDtos {

    private DogDtos() {
    }

    public record DogCreateRequest(
            @NotBlank(message = "반려견 이름을 입력해 주세요.")
            @Size(max = 20, message = "이름은 20자 이하여야 합니다.") String name,
            @Size(max = 50) String breed,
            DogGender gender,
            @PastOrPresent(message = "생일은 오늘 이전이어야 합니다.") LocalDate birthDate,
            @DecimalMin(value = "0.1") @DecimalMax(value = "150.0") BigDecimal weightKg,
            Boolean neutered,
            @Size(max = 500) String profileImageUrl
    ) {
    }

    /** 부분 수정(PATCH): null 인 필드는 변경하지 않는다. */
    public record DogUpdateRequest(
            @Size(min = 1, max = 20, message = "이름은 1~20자여야 합니다.") String name,
            @Size(max = 50) String breed,
            DogGender gender,
            @PastOrPresent(message = "생일은 오늘 이전이어야 합니다.") LocalDate birthDate,
            @DecimalMin(value = "0.1") @DecimalMax(value = "150.0") BigDecimal weightKg,
            Boolean neutered,
            @Size(max = 500) String profileImageUrl
    ) {
    }

    public record DogResponse(
            Long id,
            Long ownerId,
            String name,
            String breed,
            DogGender gender,
            LocalDate birthDate,
            BigDecimal weightKg,
            Boolean neutered,
            String profileImageUrl,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static DogResponse from(Dog dog) {
            return new DogResponse(dog.getId(), dog.getOwner().getId(), dog.getName(), dog.getBreed(),
                    dog.getGender(), dog.getBirthDate(), dog.getWeightKg(), dog.getNeutered(),
                    dog.getProfileImageUrl(), dog.getCreatedAt(), dog.getUpdatedAt());
        }
    }
}
