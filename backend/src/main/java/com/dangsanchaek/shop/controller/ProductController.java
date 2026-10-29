package com.dangsanchaek.shop.controller;

import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.shop.domain.ProductCategory;
import com.dangsanchaek.shop.dto.ShopDtos.ProductResponse;
import com.dangsanchaek.shop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /** GET /products?category=SNACK&keyword=연어&page=0&size=20 (비로그인 허용) */
    @GetMapping
    public PageResponse<ProductResponse> list(@RequestParam(required = false) ProductCategory category,
                                              @RequestParam(required = false) String keyword,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return productService.searchOnSale(category, keyword,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50), Sort.by(Sort.Direction.DESC, "id")));
    }

    @GetMapping("/{productId}")
    public ProductResponse get(@PathVariable Long productId) {
        return productService.getOnSale(productId);
    }
}
