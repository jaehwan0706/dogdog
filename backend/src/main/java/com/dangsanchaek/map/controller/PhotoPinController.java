package com.dangsanchaek.map.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.map.dto.PhotoPinDtos.PhotoPinCreateRequest;
import com.dangsanchaek.map.dto.PhotoPinDtos.PhotoPinResponse;
import com.dangsanchaek.map.service.PhotoPinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PhotoPinController {

    private final PhotoPinService photoPinService;

    /** multipart/form-data: image(파일), latitude, longitude, memo?, walkId? */
    @PostMapping(value = "/photo-pins", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoPinResponse> create(@LoginUser Long userId,
                                                   @Valid @ModelAttribute PhotoPinCreateRequest request,
                                                   @RequestPart("image") MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED).body(photoPinService.create(userId, request, image));
    }

    /** 내 사진 핀 전체 (최신순). 지도에 한 번에 표시한다. */
    @GetMapping("/photo-pins")
    public List<PhotoPinResponse> myPins(@LoginUser Long userId) {
        return photoPinService.getMyPins(userId);
    }

    @DeleteMapping("/photo-pins/{pinId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long pinId) {
        photoPinService.delete(userId, pinId);
        return ResponseEntity.noContent().build();
    }
}
