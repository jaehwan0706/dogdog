package com.dangsanchaek.dog.domain;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "dogs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Dog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(length = 50)
    private String breed;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 10)
    private DogGender gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column
    private Boolean neutered;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Builder
    private Dog(User owner, String name, String breed, DogGender gender, LocalDate birthDate, BigDecimal weightKg,
                Boolean neutered, String profileImageUrl) {
        this.owner = owner;
        this.name = name;
        this.breed = breed;
        this.gender = gender;
        this.birthDate = birthDate;
        this.weightKg = weightKg;
        this.neutered = neutered;
        this.profileImageUrl = profileImageUrl;
    }

    public boolean isOwnedBy(Long userId) {
        return owner.getId().equals(userId);
    }

    public void changeName(String name) { this.name = name; }

    public void changeBreed(String breed) { this.breed = breed; }

    public void changeGender(DogGender gender) { this.gender = gender; }

    public void changeBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public void changeWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public void changeNeutered(Boolean neutered) { this.neutered = neutered; }

    public void changeProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}
