package com.dangsanchaek.environment.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * 공공데이터 API 호출 횟수(일일 트래픽 제한)를 줄이기 위한 단순 메모리 캐시.
 * 실패(예외)는 저장하지 않으므로 다음 요청에서 다시 시도한다.
 */
class TtlCache<K, V> {

    private static final int MAX_ENTRIES = 2_000;

    private record Entry<V>(V value, Instant expiresAt) {
    }

    private final Map<K, Entry<V>> entries = new ConcurrentHashMap<>();
    private final Duration ttl;
    private final Clock clock;

    TtlCache(Duration ttl, Clock clock) {
        this.ttl = ttl;
        this.clock = clock;
    }

    V get(K key, Supplier<V> loader) {
        Instant now = clock.instant();
        Entry<V> entry = entries.get(key);
        if (entry != null && entry.expiresAt().isAfter(now)) return entry.value();

        V value = loader.get();
        if (entries.size() >= MAX_ENTRIES) entries.entrySet().removeIf(e -> !e.getValue().expiresAt().isAfter(now));
        if (entries.size() >= MAX_ENTRIES) entries.clear();
        entries.put(key, new Entry<>(value, now.plus(ttl)));
        return value;
    }
}
