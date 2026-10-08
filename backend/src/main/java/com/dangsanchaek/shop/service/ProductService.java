package com.dangsanchaek.shop.service;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.shop.domain.Product;
import com.dangsanchaek.shop.domain.ProductCategory;
import com.dangsanchaek.shop.domain.ProductStatus;
import com.dangsanchaek.shop.dto.ShopDtos.ProductCreateRequest;
import com.dangsanchaek.shop.dto.ShopDtos.ProductResponse;
import com.dangsanchaek.shop.dto.ShopDtos.ProductUpdateRequest;
import com.dangsanchaek.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    /** 일반 사용자용: 판매중(ON_SALE) 상품만 */
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> searchOnSale(ProductCategory category, String keyword, Pageable pageable) {
        return search(ProductStatus.ON_SALE, category, keyword, pageable);
    }

    /** 관리자용: 상태 필터 선택 */
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(ProductStatus status, ProductCategory category, String keyword,
                                                Pageable pageable) {
        String kw = keyword == null || keyword.isBlank() ? null : keyword.strip();
        return PageResponse.of(productRepository.search(status, category, kw, pageable), ProductResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductResponse getOnSale(Long productId) {
        return productRepository.findById(productId)
                .filter(Product::isOnSale)
                .map(ProductResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    @Transactional
    public ProductResponse create(ProductCreateRequest request) {
        Product product = productRepository.saveAndFlush(Product.builder()
                .name(request.name().strip())
                .description(request.description())
                .category(request.category())
                .price(request.price())
                .stock(request.stock())
                .imageUrl(request.imageUrl())
                .status(request.status())
                .build());
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse update(Long productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (request.name() != null) product.changeName(request.name().strip());
        if (request.description() != null) product.changeDescription(request.description());
        if (request.category() != null) product.changeCategory(request.category());
        if (request.price() != null) product.changePrice(request.price());
        if (request.stock() != null) product.changeStock(request.stock());
        if (request.imageUrl() != null) product.changeImageUrl(request.imageUrl());
        if (request.status() != null) product.changeStatus(request.status());
        productRepository.flush();
        return ProductResponse.from(product);
    }
}
