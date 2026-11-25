package com.dangsanchaek.infra.service;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.JwtProperties;
import com.dangsanchaek.config.properties.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 서버 로컬 디스크 저장소. 파일은 GET /files/{key}?expires=..&signature=.. 로 내려준다 (FileController).
 * 서명은 HMAC-SHA256(JWT 비밀키, "file:" + key + ":" + expires) 이라 별도 비밀값을 추가로 관리하지 않는다.
 */
@Slf4j
@Component
public class LocalFileStorage implements FileStorage {

    private static final Map<String, String> IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/heic", "heic");
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "jpg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "heic", "image/heic");
    // key 는 우리가 만든 "{폴더}/{UUID}.{확장자}" 형식만 허용 (경로 조작 방지)
    private static final Pattern KEY_PATTERN = Pattern.compile("[a-z-]+/[0-9a-f-]{36}\\.(jpg|png|webp|heic)");

    private final Path root;
    private final Duration urlTtl;
    private final byte[] signingKey;

    public LocalFileStorage(StorageProperties storage, JwtProperties jwt) {
        this.root = Path.of(storage.localDir()).toAbsolutePath().normalize();
        this.urlTtl = storage.urlTtl();
        this.signingKey = jwt.secret().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public String saveImage(String directory, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.IMAGE_REQUIRED);
        }
        String extension = IMAGE_EXTENSIONS.get(String.valueOf(file.getContentType()).toLowerCase());
        if (extension == null) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
        }
        String key = directory + "/" + UUID.randomUUID() + "." + extension;
        Path target = resolve(key);
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("이미지 저장 실패: " + key, e);
        }
        return key;
    }

    @Override
    public void delete(String key) {
        if (key == null || !KEY_PATTERN.matcher(key).matches()) return;
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            // 파일이 남아도 기능에는 영향이 없으므로 로그만 남긴다
            log.warn("이미지 삭제 실패: {}", key, e);
        }
    }

    @Override
    public String signedUrl(String key) {
        long expires = Instant.now().plus(urlTtl).getEpochSecond();
        return "/files/" + key + "?expires=" + expires + "&signature=" + sign(key, expires);
    }

    @Override
    public StoredFile open(String key, long expires, String signature) {
        boolean valid = KEY_PATTERN.matcher(key).matches()
                && expires >= Instant.now().getEpochSecond()
                && signature != null
                && MessageDigest.isEqual(sign(key, expires).getBytes(StandardCharsets.US_ASCII),
                                         signature.getBytes(StandardCharsets.US_ASCII));
        Path path = valid ? resolve(key) : null;
        if (path == null || !Files.isRegularFile(path)) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        String extension = key.substring(key.lastIndexOf('.') + 1);
        return new StoredFile(new FileSystemResource(path), CONTENT_TYPES.get(extension));
    }

    private Path resolve(String key) {
        Path path = root.resolve(key).normalize();
        if (!path.startsWith(root)) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return path;
    }

    private String sign(String key, long expires) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            byte[] digest = mac.doFinal(("file:" + key + ":" + expires).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
