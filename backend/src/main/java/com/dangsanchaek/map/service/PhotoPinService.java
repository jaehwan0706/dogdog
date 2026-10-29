package com.dangsanchaek.map.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserWithdrawnEvent;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.infra.service.FileStorage;
import com.dangsanchaek.map.domain.PhotoPin;
import com.dangsanchaek.map.dto.PhotoPinDtos.PhotoPinCreateRequest;
import com.dangsanchaek.map.dto.PhotoPinDtos.PhotoPinResponse;
import com.dangsanchaek.map.repository.PhotoPinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoPinService {

    private static final String IMAGE_DIRECTORY = "photo-pins";

    private final PhotoPinRepository photoPinRepository;
    private final UserReader userReader;
    private final FileStorage fileStorage;

    @Transactional
    public PhotoPinResponse create(Long userId, PhotoPinCreateRequest request, MultipartFile image) {
        User owner = userReader.getActiveUser(userId);
        String imageKey = fileStorage.saveImage(IMAGE_DIRECTORY, image);
        // DB 저장이 롤백되면 이미 저장한 파일도 지운다
        afterRollback(() -> fileStorage.delete(imageKey));

        String memo = request.memo() == null || request.memo().isBlank() ? null : request.memo().strip();
        PhotoPin pin = photoPinRepository.saveAndFlush(PhotoPin.builder()
                .owner(owner)
                .walkId(request.walkId())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .imageKey(imageKey)
                .memo(memo)
                .build());
        return toResponse(pin);
    }

    @Transactional(readOnly = true)
    public List<PhotoPinResponse> getMyPins(Long userId) {
        return photoPinRepository.findAllByOwnerIdOrderByIdDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long userId, Long pinId) {
        PhotoPin pin = photoPinRepository.findById(pinId)
                .filter(p -> p.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.PHOTO_PIN_NOT_FOUND));
        photoPinRepository.delete(pin);
        afterCommit(() -> fileStorage.delete(pin.getImageKey()));
    }

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        List<String> imageKeys = photoPinRepository.findImageKeysByOwnerId(event.userId());
        photoPinRepository.deleteAllByOwnerId(event.userId());
        afterCommit(() -> imageKeys.forEach(fileStorage::delete));
    }

    private PhotoPinResponse toResponse(PhotoPin pin) {
        return PhotoPinResponse.of(pin, fileStorage.signedUrl(pin.getImageKey()));
    }

    // 파일 삭제는 되돌릴 수 없으므로 DB 트랜잭션 결과가 확정된 뒤에 실행한다
    private static void afterCommit(Runnable action) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private static void afterRollback(Runnable action) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) action.run();
            }
        });
    }
}
