import type { Product } from '../../types/shop';

// 백엔드 연결 전 하드코딩 상품 (10.08 회의: 마켓 하드코딩). 이미지 URL 은 아직 없어 카테고리 아이콘으로 표시
const createdAt = '2026-10-01T09:00:00';

export const mockProducts: Product[] = [
  { id: 1, name: '프레쉬핏 워크 하네스', description: '가슴 압박을 줄인 H형 하네스. 야간 산책용 반사 테이프가 둘러져 있어요.', category: 'WALK', price: 42000, stock: 12, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 2, name: '포레스트 투어 리드줄 1.5m', description: '손목 스트랩과 충격 흡수 밴드가 달린 데일리 리드줄.', category: 'WALK', price: 28000, stock: 20, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 3, name: '생분해 배변봉투 120매', description: '옥수수 전분 소재의 생분해 봉투. 디스펜서 호환 롤 8개 구성.', category: 'WALK', price: 9900, stock: 50, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 4, name: '연어 & 고구마 그레인프리 사료 2kg', description: '단일 단백질 연어와 고구마로 만든 전연령 사료.', category: 'FOOD', price: 36000, stock: 8, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 5, name: '저알러지 오리 사료 1.2kg', description: '피부가 예민한 아이를 위한 오리 단백질 사료.', category: 'FOOD', price: 27500, stock: 0, soldOut: true, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 6, name: '동결건조 닭가슴살 트릿', description: '닭가슴살 100%를 동결건조해 산책 보상용으로 좋아요.', category: 'SNACK', price: 12000, stock: 30, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 7, name: '덴탈 껌 S 사이즈 20개입', description: '하루 한 개로 치석 관리. 소형견용.', category: 'SNACK', price: 15800, stock: 25, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 8, name: '노즈워크 담요', description: '간식을 숨겨 후각 놀이를 할 수 있는 담요. 세탁기 사용 가능.', category: 'TOY', price: 24000, stock: 10, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 9, name: '천연고무 터그 로프', description: '당기기 놀이용 로프 장난감.', category: 'TOY', price: 11000, stock: 3, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 10, name: '산책 후 발 세정 폼', description: '물 없이 거품으로 닦아내는 발 세정제 150ml.', category: 'HYGIENE', price: 13500, stock: 40, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 11, name: '저자극 물티슈 80매 x 3팩', description: '산책 후 몸과 얼굴을 닦는 무향 물티슈.', category: 'HYGIENE', price: 8900, stock: 60, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 12, name: '방수 레인코트', description: '비 오는 날 산책용 4발 레인코트. S/M 사이즈.', category: 'CLOTHING', price: 32000, stock: 6, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 13, name: '경량 패딩 조끼', description: '가을·겨울 산책용 경량 패딩. 하네스 구멍이 있어요.', category: 'CLOTHING', price: 38000, stock: 9, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
  { id: 14, name: '휴대용 접이식 물병', description: '산책 중 바로 물을 줄 수 있는 원터치 물병 350ml.', category: 'ETC', price: 14000, stock: 18, soldOut: false, imageUrl: null, status: 'ON_SALE', createdAt },
];
