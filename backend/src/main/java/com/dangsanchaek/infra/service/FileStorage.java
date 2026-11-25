package com.dangsanchaek.infra.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 업로드 이미지 저장소. 지금은 서버 로컬 디스크(LocalFileStorage)이고,
 * S3/네이버 Object Storage 로 옮길 때는 이 인터페이스의 구현만 교체한다.
 * DB 에는 URL 이 아니라 key(예: photo-pins/3f2a....jpg)를 저장한다.
 */
public interface FileStorage {

    /** 이미지(jpeg/png/webp/heic)를 directory 아래에 새 이름으로 저장하고 key 를 돌려준다. */
    String saveImage(String directory, MultipartFile file);

    /** 없는 key 여도 오류 없이 넘어간다. */
    void delete(String key);

    /** 일정 시간만 유효한 서명된 URL. 비공개 사진도 별도 인증 헤더 없이 &lt;img&gt; 로 열 수 있다. */
    String signedUrl(String key);

    /** 서명을 검증하고 파일을 연다. 서명이 틀리거나 만료됐거나 파일이 없으면 NOT_FOUND. */
    StoredFile open(String key, long expires, String signature);

    record StoredFile(Resource resource, String contentType) {
    }
}
