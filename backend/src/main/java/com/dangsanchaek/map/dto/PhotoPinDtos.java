package com.dangsanchaek.map.dto;

import com.dangsanchaek.map.domain.PhotoPin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class PhotoPinDtos {

    private PhotoPinDtos() {
    }

    /** multipart/form-data 의 텍스트 필드. 사진은 "image" 파트로 따로 받는다. */
    public record PhotoPinCreateRequest(
            @NotNull(message = "위도를 입력해 주세요.")
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @NotNull(message = "경도를 입력해 주세요.")
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @Size(max = 200, message = "메모는 200자 이하여야 합니다.") String memo,
            Long walkId
    ) {
    }

    /** imageUrl 은 일정 시간만 유효한 서명된 URL 이다 (상대 경로면 API 베이스 URL 을 앞에 붙인다). */
    public record PhotoPinResponse(
            Long id,
            Long walkId,
            double latitude,
            double longitude,
            String imageUrl,
            String memo,
            LocalDateTime createdAt
    ) {
        public static PhotoPinResponse of(PhotoPin pin, String imageUrl) {
            return new PhotoPinResponse(pin.getId(), pin.getWalkId(), pin.getLatitude(), pin.getLongitude(),
                    imageUrl, pin.getMemo(), pin.getCreatedAt());
        }
    }
}
