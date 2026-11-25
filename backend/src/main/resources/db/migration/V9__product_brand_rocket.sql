-- 마켓 상품 카드에 표시할 브랜드명과 로켓배송 여부
ALTER TABLE products ADD COLUMN brand VARCHAR(50) NULL;
ALTER TABLE products ADD COLUMN is_rocket BOOLEAN NOT NULL DEFAULT FALSE;

-- V8 로 넣은 쿠팡 추천 상품은 상품명의 첫 단어를 브랜드로 우선 채운다 (관리자 메뉴에서 수정 가능).
-- 로켓배송 여부는 모두 FALSE 로 두고 관리자가 확인해서 켠다.
UPDATE products
SET brand = LEFT(CASE WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name, 1, POSITION(' ' IN name) - 1) ELSE name END, 50)
WHERE affiliate_url IS NOT NULL AND brand IS NULL;
