package com.dangsanchaek.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 모든 오류 응답의 공통 형식.
 * 예) {"status":409,"code":"EMAIL_ALREADY_EXISTS","message":"이미 사용 중인 이메일입니다."}
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ErrorResponse(int status, String code, String message, List<FieldError> errors) {

    public record FieldError(String field, String message) {
    }

    public static ErrorResponse of(ErrorCode code) {
        return of(code, code.getMessage());
    }

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(code.getStatus().value(), code.name(), message, List.of());
    }

    public static ErrorResponse of(ErrorCode code, List<FieldError> errors) {
        return new ErrorResponse(code.getStatus().value(), code.name(), code.getMessage(), errors);
    }
}
