-- 쿠팡 파트너스 제휴 링크. 마켓에서 상품을 누르면 이 주소로 이동한다. (자체 판매 상품은 NULL)
ALTER TABLE products ADD COLUMN affiliate_url VARCHAR(1000) NULL;
