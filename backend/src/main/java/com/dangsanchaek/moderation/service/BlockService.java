package com.dangsanchaek.moderation.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.moderation.domain.UserBlock;
import com.dangsanchaek.moderation.dto.ModerationDtos.BlockedUserResponse;
import com.dangsanchaek.moderation.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final UserReader userReader;

    /** 이미 차단했으면 그대로 둔다 (멱등) */
    @Transactional
    public void block(Long userId, Long targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new BusinessException(ErrorCode.CANNOT_BLOCK_SELF);
        }
        userReader.getActiveUser(userId);
        if (!userRepository.existsById(targetUserId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (!userBlockRepository.existsByBlockerIdAndBlockedId(userId, targetUserId)) {
            userBlockRepository.save(new UserBlock(userId, targetUserId));
        }
    }

    @Transactional
    public void unblock(Long userId, Long targetUserId) {
        userBlockRepository.deleteByBlockerIdAndBlockedId(userId, targetUserId);
    }

    @Transactional(readOnly = true)
    public List<BlockedUserResponse> getBlockedUsers(Long userId) {
        List<UserBlock> blocks = userBlockRepository.findByBlockerIdOrderByIdDesc(userId);
        Map<Long, User> users = userRepository.findAllById(blocks.stream().map(UserBlock::getBlockedId).toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return blocks.stream()
                .filter(b -> users.containsKey(b.getBlockedId()))
                .map(b -> {
                    User u = users.get(b.getBlockedId());
                    return new BlockedUserResponse(u.getId(), u.getNickname(), u.getProfileImageUrl(), b.getCreatedAt());
                })
                .toList();
    }
}
