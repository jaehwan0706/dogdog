-- 로컬 개발용 샘플 상품 (application-local.yml 의 flyway.locations 에 db/seed 를 넣었을 때만 실행)
-- id 를 직접 넣으면 PostgreSQL 자동 번호와 겹치므로 이름으로 중복만 막는다
INSERT INTO products (name, description, category, price, stock, image_url, status, created_at, updated_at)
SELECT v.name, v.description, v.category, v.price, v.stock, NULL, 'ON_SALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('프리미엄 연어 사료 2kg', '알러지 걱정 줄인 연어 단일 단백질 사료', 'FOOD', 32000, 50),
    ('수제 닭가슴살 육포 100g', '무첨가 국내산 닭가슴살 100%', 'SNACK', 8900, 100),
    ('덴탈껌 15개입', '치석 관리용 덴탈껌', 'SNACK', 12000, 80),
    ('삑삑이 공 장난감', '소리 나는 고무 공 (소형견용)', 'TOY', 5500, 200),
    ('야간 반사 리드줄 1.5m', '밤 산책용 반사 소재 리드줄', 'WALK', 15900, 40),
    ('생분해 배변봉투 120매', '산책 필수품, 생분해 소재', 'WALK', 6900, 150),
    ('저자극 강아지 샴푸 500ml', '약산성 저자극 샴푸', 'HYGIENE', 14500, 30),
    ('한정판 레인코트 (품절 테스트용)', '재고 0 상품', 'CLOTHING', 25000, 0)
) AS v(name, description, category, price, stock)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);
