package com.dangsanchaek.infra.controller;

import com.dangsanchaek.infra.service.FileStorage;
import com.dangsanchaek.infra.service.FileStorage.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * 서명된 URL 로 업로드 파일을 내려준다. 인증 헤더 대신 URL 의 서명·만료로 접근을 제한한다 (SecurityConfig 에서 permitAll).
 */
@RestController
@RequiredArgsConstructor
public class FileController {

    private final FileStorage fileStorage;

    @GetMapping("/files/{directory}/{filename}")
    public ResponseEntity<Resource> get(@PathVariable String directory, @PathVariable String filename,
                                        @RequestParam long expires, @RequestParam String signature) {
        StoredFile file = fileStorage.open(directory + "/" + filename, expires, signature);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .body(file.resource());
    }
}
