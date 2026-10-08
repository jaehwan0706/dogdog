package com.dangsanchaek.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP 메서드입니다."),
    CONFLICT(HttpStatus.CONFLICT, "이미 처리되었거나 충돌하는 요청입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증/회원
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    EMAIL_REGISTERED_WITH_OTHER_PROVIDER(HttpStatus.CONFLICT, "다른 로그인 방식으로 가입된 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 일치하지 않습니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "리프레시 토큰이 유효하지 않거나 만료되었습니다."),
    INVALID_SOCIAL_TOKEN(HttpStatus.UNAUTHORIZED, "소셜 로그인 토큰을 검증할 수 없습니다."),
    UNSUPPORTED_PROVIDER(HttpStatus.BAD_REQUEST, "지원하지 않는 로그인 방식입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    PASSWORD_LOGIN_NOT_AVAILABLE(HttpStatus.BAD_REQUEST, "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다."),
    INVALID_CURRENT_PASSWORD(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),

    // 반려견
    DOG_NOT_FOUND(HttpStatus.NOT_FOUND, "반려견 정보를 찾을 수 없습니다."),
    DOG_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "반려견은 최대 10마리까지 등록할 수 있습니다."),

    // 커뮤니티
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    RECRUIT_FIELDS_REQUIRED(HttpStatus.BAD_REQUEST, "모집 게시글은 일시(meetAt, 현재 이후)와 모집 인원(maxParticipants)이 필요합니다."),
    NOT_RECRUIT_POST(HttpStatus.BAD_REQUEST, "모집(친구모집/품앗이) 게시글이 아닙니다."),
    RECRUIT_CLOSED(HttpStatus.CONFLICT, "모집이 마감되었습니다."),
    RECRUIT_FULL(HttpStatus.CONFLICT, "모집 인원이 가득 찼습니다."),
    ALREADY_PARTICIPATING(HttpStatus.CONFLICT, "이미 참여 신청한 모집입니다."),
    CANNOT_JOIN_OWN_POST(HttpStatus.BAD_REQUEST, "본인 게시글에는 참여 신청할 수 없습니다."),
    NOT_PARTICIPATING(HttpStatus.NOT_FOUND, "참여 신청 내역이 없습니다."),
    MAX_PARTICIPANTS_TOO_SMALL(HttpStatus.BAD_REQUEST, "모집 인원은 현재 참여 인원보다 적을 수 없습니다."),
    INVALID_PARENT_COMMENT(HttpStatus.BAD_REQUEST, "답글은 같은 게시글의 최상위 댓글에만 달 수 있습니다."),

    // 마켓
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    PRODUCT_NOT_ON_SALE(HttpStatus.BAD_REQUEST, "판매 중인 상품이 아닙니다."),
    OUT_OF_STOCK(HttpStatus.CONFLICT, "재고가 부족합니다."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    ORDER_ITEMS_REQUIRED(HttpStatus.BAD_REQUEST, "items 또는 cartItemIds 중 하나만 지정해야 합니다."),
    INVALID_ORDER_STATUS(HttpStatus.CONFLICT, "현재 주문 상태에서는 처리할 수 없습니다."),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "결제 금액이 주문 금액과 일치하지 않습니다."),
    PAYMENT_FAILED(HttpStatus.BAD_GATEWAY, "결제 승인에 실패했습니다."),
    PAYMENT_CANCEL_FAILED(HttpStatus.BAD_GATEWAY, "결제 취소에 실패했습니다.");

    private final HttpStatus status;
    private final String message;
}
