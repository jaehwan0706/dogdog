// 백엔드 WalkDtos 와 맞춘 타입

export type WalkStatus = 'IN_PROGRESS' | 'FINISHED';

export type Walk = {
  id: number;
  dogId: number | null;
  dogName: string | null;
  status: WalkStatus;
  // 서버 시각 (시간대 없는 "2026-10-30T16:37:07")
  startedAt: string;
  endedAt: string | null;
  // 종료 시 서버가 경로로 계산한 값 (진행 중에는 0)
  distanceMeters: number;
  durationSeconds: number;
};

// seq: 산책마다 0부터 1씩 늘리는 순번. 서버는 이미 받은 seq 를 무시하므로 같은 좌표를 다시 보내도 된다
export type WalkPoint = { seq: number; latitude: number; longitude: number };

export type WalkDetail = Walk & { points: WalkPoint[] };
