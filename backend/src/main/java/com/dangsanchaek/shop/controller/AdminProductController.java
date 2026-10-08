package com.dangsanchaek.shop.controller;

import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.shop.domain.ProductCategory;
import com.dangsanchaek.shop.domain.ProductStatus;
import com.dangsanchaek.shop.dto.ShopDtos.ProductCreateRequest;
import com.dangsanchaek.shop.dto.ShopDtos.ProductResponse;
import com.dangsanchaek.shop.dto.ShopDtos.ProductUpdateRequest;
import com.dangsanchaek.shop.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 관리자 전용(ROLE_ADMIN): 상품 등록/수정. 권한 검사는 SecurityConfig 의 /admin/** 규칙. */
@RestController
@RequestMapping("/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> list(@RequestParam(required = false) ProductStatus status,
                                              @RequestParam(required = false) ProductCategory category,
                                              @RequestParam(required = false) String keyword,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return productService.search(status, category, keyword,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PatchMapping("/{productId}")
    public ProductResponse update(@PathVariable Long productId, @Valid @RequestBody ProductUpdateRequest request) {
        return productService.update(productId, request);
    }
}
