package com.dangsanchaek.shop.domain;

public enum ProductStatus {
    /** 판매중 (재고 0 이면 품절로 표시) */
    ON_SALE,
    /** 판매중지(목록 비노출) */
    HIDDEN
}
