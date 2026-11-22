import type { Product } from '../../types/shop';

// 백엔드 연결 전 하드코딩 상품 (10.08 회의: 마켓 하드코딩). 이미지 URL 은 아직 없어 카테고리 아이콘으로 표시
const createdAt = '2026-10-01T09:00:00';

// brand 가 없으면 상품명 첫 단어, isRocket 이 없으면 false 로 채운다 (mockShopService)
// TODO: 로켓배송 상품은 isRocket: true 로 표시 (서버 데이터는 관리자 메뉴에서 수정)
export const mockProducts: (Omit<Product, 'affiliateUrl' | 'brand' | 'isRocket'> & { affiliateUrl?: string | null; brand?: string | null; isRocket?: boolean })[] = [
  {
    id: 134, name: '지위픽 전연령 스팀드라이 독 건식사료, 소, 800g, 1개',
    description: '소고기를 사용한 전연령 반려견용 스팀드라이 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2a.coupangcdn.com/image/affiliate/banner/1e82d12f0ccbf2eed83de8a2338dda1d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUKHLTYAK', status: 'ON_SALE', createdAt,
  },
  {
    id: 133, name: '오가다이어트 유기농 가수분해 애견사료 오리현미, 6kg, 1개',
    description: '오리와 현미를 사용한 가수분해 반려견용 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4a.coupangcdn.com/image/affiliate/banner/5fe733e0a999b65fca9984f7cbfa9678@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUJ7Iaa72', status: 'ON_SALE', createdAt,
  },
  {
    id: 132, name: '본아페티 강아지 기능성 사료, 호흡기·기관지, 1kg, 1개',
    description: '반려견의 호흡기와 기관지 영양 관리를 고려한 기능성 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5c.coupangcdn.com/image/affiliate/banner/9599698253b62fd4f3740ee23e913962@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUI2AA68a', status: 'ON_SALE', createdAt,
  },
  {
    id: 131, name: '하림펫푸드 어덜트 더리얼 그레인프리 오븐베이크드, 소, 1.6kg',
    description: '소고기를 사용해 오븐에 구운 성견용 그레인프리 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5c.coupangcdn.com/image/affiliate/banner/c7adf68e3c4440e87e6f9792abb2c8d8@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUIeohqaA', status: 'ON_SALE', createdAt,
  },
  {
    id: 130, name: '디오벨르 원터치 털엉킴방지 반려동물 빗, 그레이, 1개',
    description: '엉킨 털과 빠진 털을 정리하고 버튼으로 털을 제거하는 원터치 브러쉬예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image10.coupangcdn.com/image/affiliate/banner/818561b68bab7d5a8fc2ee63dd584182@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUzOHiu8y', status: 'ON_SALE', createdAt,
  },
  {
    id: 129, name: 'KAMBU 강아지 고양이 눈꼽·눈물자국 미세빗, 블루, 1개',
    description: '반려동물 눈 주변의 눈곱과 미세 이물질을 정리하는 촘촘한 빗이에요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/ba1a3f30365c2c8ed048e98ee5b6f41e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUyPA63ga', status: 'ON_SALE', createdAt,
  },
  {
    id: 128, name: '행복한댕냥이 원터치 케어 브러쉬, 핑크, 1개',
    description: '버튼을 눌러 모인 털을 간편하게 분리하는 핑크 원터치 브러쉬예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/3d815780da8e3fa5417b80a699e5fefd@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUxYLUao8', status: 'ON_SALE', createdAt,
  },
  {
    id: 127, name: '붐붐포 이지 클린 그루밍 라운드 눈꼽빗, 레드, 1개',
    description: '둥근 형태로 반려동물 눈 주변을 정돈하기 좋은 그루밍 눈꼽빗이에요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image12.coupangcdn.com/image/affiliate/banner/72521f1c4b272b6c8003410db57b57d2@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUxjVSN6O', status: 'ON_SALE', createdAt,
  },
  {
    id: 126, name: '코멧 펫 고무헤드 반려동물 슬리커 브러쉬, 1개',
    description: '고무헤드로 반려동물의 빠진 털을 부드럽게 정리하는 슬리커 브러쉬예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image8.coupangcdn.com/image/affiliate/banner/1ec3a674254ef6bf02df42010ec0e9d5@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUwCv7yUe', status: 'ON_SALE', createdAt,
  },
  {
    id: 125, name: '라무달리 반려동물 원터치 브러쉬, 혼합색상, 1개',
    description: '빠진 털을 빗고 버튼으로 손쉽게 비울 수 있는 원터치 브러쉬예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image12.coupangcdn.com/image/affiliate/banner/7f430ea3ac58e839a4390bd1afb38bfd@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUvuCfYXc', status: 'ON_SALE', createdAt,
  },
  {
    id: 124, name: '행복한댕냥이 원터치 케어 브러쉬, 블루, 1개',
    description: '버튼을 눌러 모인 털을 간편하게 분리하는 블루 원터치 브러쉬예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image5.coupangcdn.com/image/affiliate/banner/9d15404fbe1190b9c8ef0e4e87575f60@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUuWWeF8C', status: 'ON_SALE', createdAt,
  },
  {
    id: 123, name: '서온리 3in1 반려동물 죽은털 제거 슬리커 브러쉬, 그레이, 1세트',
    description: '빗질과 죽은 털 제거를 한 번에 돕는 3in1 반려동물 브러쉬 세트예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/39fadf534264805356a31660b0cfa156@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUuvcDQSy', status: 'ON_SALE', createdAt,
  },
  {
    id: 122, name: '딩동펫 반려동물 LED 안전 발톱깎이, 핑크, 1개',
    description: 'LED 조명으로 발톱을 살피며 손질할 수 있는 반려동물용 발톱깎이예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image15.coupangcdn.com/image/affiliate/banner/6b46ac8b6a25411f6b305903cc59d01f@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUstBLpDw', status: 'ON_SALE', createdAt,
  },
  {
    id: 121, name: '리스펫 반려동물 다보여 발톱깎이, 블루, 1개',
    description: '발톱 위치를 확인하며 손질하기 편한 반려동물용 블루 발톱깎이예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image2.coupangcdn.com/image/affiliate/banner/2bfd9ffa2fc1ffb6f658ffb8d24778d8@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUrP5PxYG', status: 'ON_SALE', createdAt,
  },
  {
    id: 120, name: '바비온 반려동물 발톱다듬기 BG-11, 혼합색상, 1개',
    description: '반려동물의 발톱 끝을 부드럽게 정리하는 전동 발톱 다듬기 제품이에요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/38ee6d7393e6044749204a2c49954c80@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUq4ZdkB2', status: 'ON_SALE', createdAt,
  },
  {
    id: 119, name: '리스펫 반려동물 LED 다보여 발톱깎이, 핑크, 1개',
    description: 'LED 조명으로 발톱 위치를 확인하며 손질하는 반려동물용 발톱깎이예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image12.coupangcdn.com/image/affiliate/banner/bcbc0cb73ae45f30ce33c79eb1cd371e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUpOkDzeS', status: 'ON_SALE', createdAt,
  },
  {
    id: 118, name: '코멧 펫 스테인리스 커브 미용가위 18cm, 1개',
    description: '곡선 날로 반려동물의 얼굴과 몸 주변 털을 다듬기 좋은 미용가위예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image8.coupangcdn.com/image/affiliate/banner/2e4923479a2b6a9035d1814195b70088@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUo1vn9Mq', status: 'ON_SALE', createdAt,
  },
  {
    id: 117, name: '펫드리머 반려동물 브러쉬 자동 목욕거품기 PDB-001, 화이트',
    description: '브러싱과 거품 분사를 함께 할 수 있는 반려동물 목욕 보조기예요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2c.coupangcdn.com/image/affiliate/banner/0230a538be29bf4ba576ee9873f5115a@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUhtNyzND', status: 'ON_SALE', createdAt,
  },
  {
    id: 116, name: '퓨어버디 올인원 애플블라썸향 강아지 샴푸, 500ml, 1개',
    description: '반려견의 털과 피부 세정을 위한 올인원 샴푸예요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/5dbc8dc1b45b6ae2363a96d2bba9d2c7@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUgUGlN5U', status: 'ON_SALE', createdAt,
  },
  {
    id: 115, name: 'JW 반려동물 힐링 샤워 헤드, 혼합색상, 1개',
    description: '반려동물 목욕 시 물줄기를 편리하게 조절하는 전용 샤워헤드예요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4a.coupangcdn.com/image/affiliate/banner/4e1a2097b0a6cb763c202c45a1e84b38@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUgtMufPE', status: 'ON_SALE', createdAt,
  },
  {
    id: 114, name: '초스피드 흡수력 반려동물 목욕 타월, 블루·옐로우, 1개',
    description: '목욕 후 반려동물의 물기를 빠르게 닦는 흡수형 펫타월이에요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/9c9624d0a42980d5287a16a95822d3a9@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUgaG28vQ', status: 'ON_SALE', createdAt,
  },
  {
    id: 113, name: '닥터블랭크 실리콘 죽은털 제거 목욕 브러쉬 장갑, 양손 세트',
    description: '목욕하면서 부드럽게 마사지하고 죽은 털을 정리하는 실리콘 장갑이에요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/f7da2373ef617a74b127881ada2e40d9@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUfQKiQMK', status: 'ON_SALE', createdAt,
  },
  {
    id: 112, name: '딩동펫 반려동물 서라운드 소프트 접이식 욕조 소형, 그레이',
    description: '보관과 이동이 편리한 소형 반려동물용 접이식 목욕 욕조예요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/1cb72ec056331c073f2137f463a60e7e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUfzgka5c', status: 'ON_SALE', createdAt,
  },
  {
    id: 111, name: '딩동펫 반려동물 말랑 샴푸 브러쉬, 옐로우, 1개',
    description: '샴푸 거품과 마사지에 사용하는 말랑한 실리콘 목욕 브러쉬예요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/0aee91f1474b22ea0bbff5d9388840a1@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUfe54fbF', status: 'ON_SALE', createdAt,
  },
  {
    id: 110, name: '견달 말티즈 전용 저자극 샴푸·린스 겸용, 500ml, 1개',
    description: '말티즈의 털과 피부 세정을 위한 샴푸·린스 겸용 제품이에요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/2232164f7aa33a0c159a67f1be20760b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUeRy32B2', status: 'ON_SALE', createdAt,
  },
  {
    id: 109, name: '더마벳 저자극 강아지 pH6.9 더마샴푸, 500ml, 1개',
    description: '반려견의 털과 피부를 순하게 세정하는 저자극 샴푸예요.', category: 'BATH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image4.coupangcdn.com/image/affiliate/banner/c5467177b98fceb0bc03fb8e50b4a921@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPUeysWCXs', status: 'ON_SALE', createdAt,
  },
  {
    id: 108, name: '미오펫 3in1 LED 저소음 부분미용 바리깡, 화이트, 1개',
    description: '발바닥 등 좁은 부위를 손질하기 좋은 LED 저소음 클리퍼예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image7.coupangcdn.com/image/affiliate/banner/7f17b66e39bcb8b1ab1c3add084502e4@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT7RxWTZI', status: 'ON_SALE', createdAt,
  },
  {
    id: 107, name: '반려동물 미용·목욕 해먹 접이식 테이블 발톱 거치대, 그레이',
    description: '목욕과 발톱 손질 때 반려동물을 안정적으로 받쳐주는 미용 해먹 세트예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/8be45a102cbc339e9e2197ad01ef8353@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT7tKcmKi', status: 'ON_SALE', createdAt,
  },
  {
    id: 106, name: '디클펫 7in1 진공 흡입 반려동물 미용기 CLM1, 화이트, 1개',
    description: '커트와 털 흡입을 함께 할 수 있는 7in1 반려동물 미용기예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image4.coupangcdn.com/image/affiliate/banner/0e9b4267458f45033545117fa064111b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT69VP6Dk', status: 'ON_SALE', createdAt,
  },
  {
    id: 105, name: '바론 이지풋프로 반려동물 발바닥 바리깡, 샌드베이지, 1개',
    description: '반려동물 발바닥과 부분 털 손질에 사용하는 소형 바리깡이에요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4c.coupangcdn.com/image/affiliate/banner/f52b8446f77e92058b45caecf71ca80b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT6PTiKei', status: 'ON_SALE', createdAt,
  },
  {
    id: 104, name: '고요펫 초밀착 곡선 36날 저소음 강아지 클리퍼 GOYO-8100',
    description: '곡선형 36날을 적용한 저소음 반려견 미용 클리퍼예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/c9dbdf4c5b6a46c2da6e3b18e0173968@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT57CYhUW', status: 'ON_SALE', createdAt,
  },
  {
    id: 103, name: '펫픽어스 반려동물 진공 흡입 바리깡 털 이발 청소기 세트',
    description: '털 손질과 흡입 청소를 함께 할 수 있는 반려동물 미용기 세트예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/5451ff0e9acd12c48438a779595c632e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT5GxpLhc', status: 'ON_SALE', createdAt,
  },
  {
    id: 102, name: '애견 안전 미용가위 반려동물 가위 세트, 실버, 1세트',
    description: '반려동물의 얼굴과 전신 털을 안전하게 다듬기 위한 미용가위 세트예요.', category: 'GROOMING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/d2544ad73023d4020dccc83168db8a1a@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPT5qyDK2e', status: 'ON_SALE', createdAt,
  },
  {
    id: 101, name: '닥터조이 강아지 케어 영양제, 70정, 종합영양제, 1개',
    description: '반려견의 일상 영양 관리를 위한 종합 영양 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image12.coupangcdn.com/image/affiliate/banner/d23ef5490c98b86a946867b2b2f2801d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTXwkqd9o', status: 'ON_SALE', createdAt,
  },
  {
    id: 100, name: '붐붐포 강아지 슈퍼바이트 영양제, 50정, 종합영양제, 1개',
    description: '간식처럼 급여할 수 있는 반려견용 종합 영양 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/55f5a00533c51f7a8b069ea3aa63515b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTW53FTNc', status: 'ON_SALE', createdAt,
  },
  {
    id: 99, name: '닥터바이 브레스 강아지 기관지 영양제, 30회분, 2세트',
    description: '반려견의 호흡기와 기관지 영양 관리를 돕는 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4c.coupangcdn.com/image/affiliate/banner/043371678b8b29965a835307b77d6289@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTWIbMtFs', status: 'ON_SALE', createdAt,
  },
  {
    id: 98, name: '탐사 강아지 뉴트리션 트릿 영양제, 뼈·관절관리, 300g, 1개',
    description: '반려견의 뼈와 관절 영양 관리를 위한 트릿형 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1a.coupangcdn.com/image/affiliate/banner/1e0c78ed94208c6d97409085410bf5a7@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTVWhqMvI', status: 'ON_SALE', createdAt,
  },
  {
    id: 97, name: '라온포즈 강아지 면역 멀티 올인원 데일리케어, 40g, 1개',
    description: '반려견의 일상 영양 균형을 위한 멀티 올인원 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image13.coupangcdn.com/image/affiliate/banner/d4ca89614d384ccb5f3932f8a88cef92@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTVieeqAu', status: 'ON_SALE', createdAt,
  },
  {
    id: 96, name: '라온포즈 데일리케어 강아지 종합영양제 40g 휴대용케이스 세트',
    description: '휴대용 케이스가 포함된 반려견 데일리 종합 영양 보조 세트예요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image7.coupangcdn.com/image/affiliate/banner/8c57a335502035cbec0dd479d87457ea@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTUSQTiDI', status: 'ON_SALE', createdAt,
  },
  {
    id: 95, name: '디어랩스 울애기쌩쌩 노견 종합영양제, 60정, 1개',
    description: '노령견의 눈·피부·관절·면역·장 영양 관리를 위한 종합 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/8099e1509f876e2982f4988c730f2caa@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTUxge1ds', status: 'ON_SALE', createdAt,
  },
  {
    id: 94, name: '포켄스 강아지 뉴트리션 트릿 영양제, 뼈·관절강화, 240g, 1개',
    description: '반려견의 뼈와 관절 영양 관리를 위한 트릿형 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image15.coupangcdn.com/image/affiliate/banner/5b11b3343423ccc9b3d53dbed52278ca@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTUbwCFHM', status: 'ON_SALE', createdAt,
  },
  {
    id: 93, name: '마이펫닥터 덴탈원츄 구강케어 양치껌 30p, 80g, 1개',
    description: '씹으면서 구강 영양 관리를 돕는 반려견용 덴탈 보조 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image9.coupangcdn.com/image/affiliate/banner/2ead8c11443eefd23f940e586f25a9f9@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTTzrEkLI', status: 'ON_SALE', createdAt,
  },
  {
    id: 92, name: '닥터바이 N케어 아이즈·조인트·하트업 영양제 3종 선물세트, 70정',
    description: '눈·관절·심장 영양 관리를 위한 반려견용 3종 보조 제품 세트예요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image5.coupangcdn.com/image/affiliate/banner/2bad0e151d7c6fd9b01857f0f9e24731@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTTiKuFrg', status: 'ON_SALE', createdAt,
  },
  {
    id: 91, name: '반려동물 중성화 수술복 올인원, 핑크소녀, 1개',
    description: '중성화 수술 후 환부 보호에 사용하는 올인원 수술복이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image14.coupangcdn.com/image/affiliate/banner/05f4f7905603a08bd842f196efe88606@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTN8Y2tRA', status: 'ON_SALE', createdAt,
  },
  {
    id: 90, name: '바사바사 강아지 퐁퐁 후리스, 브라운, 1개',
    description: '쌀쌀한 날씨에 입히기 좋은 포근한 후리스 의류예요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5c.coupangcdn.com/image/affiliate/banner/79114c1d8efd0fedc9253b39ecf41adc@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTNEwTln2', status: 'ON_SALE', createdAt,
  },
  {
    id: 89, name: '렛츠독 강아지 기모 조끼 일체형 하네스 야구점퍼, 레드베어, 1개',
    description: '기모 조끼와 하네스가 하나로 연결된 겨울 외출복이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1a.coupangcdn.com/image/affiliate/banner/59b31ad259cd565dc9b8f4bbbad5c8f1@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTNj0nBgO', status: 'ON_SALE', createdAt,
  },
  {
    id: 88, name: '팬더 캐릭터 강아지 후리스 올인원, 화이트 M, 1개',
    description: '팬더 캐릭터가 들어간 포근한 겨울용 후리스 올인원이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image7.coupangcdn.com/image/affiliate/banner/d9332a6b4948e5f4e0fc8f2aca3771a2@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTMTSnpTM', status: 'ON_SALE', createdAt,
  },
  {
    id: 87, name: '강아지 겨울 후리스 멜빵바지 곰돌이 포인트, 핑크, 1개',
    description: '곰돌이 포인트가 있는 보온용 후리스 멜빵 외출복이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image4.coupangcdn.com/image/affiliate/banner/b0cd5a7c4b765851f94c2db39217020d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTMw5DPwG', status: 'ON_SALE', createdAt,
  },
  {
    id: 86, name: '코코스튜디오 강아지 양블리 겨울 조끼, 그린, 1개',
    description: '겨울 외출 때 체온 유지를 돕는 강아지 조끼예요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image15.coupangcdn.com/image/affiliate/banner/59d5329afe3e2d2fcfec8e354abf6be0@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTL2cf3Qa', status: 'ON_SALE', createdAt,
  },
  {
    id: 85, name: '대형견 강아지 김장조끼 패딩, 레드, 1개',
    description: '대형견도 착용할 수 있는 겨울용 누빔 패딩 조끼예요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image13.coupangcdn.com/image/affiliate/banner/14f66df8436b544fd02ef835175afb6c@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTLCrHvfU', status: 'ON_SALE', createdAt,
  },
  {
    id: 84, name: '융풍 강아지 곰돌이 후드 플리스 올인원, 브라운, 1개',
    description: '소형견의 실내복과 외출복으로 활용하는 후드 플리스 올인원이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/ca5cbb313768431dfedd9e80df1262c5@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTLcyDOYS', status: 'ON_SALE', createdAt,
  },
  {
    id: 83, name: '멍케어 강아지 신축성 봄가을 올인원, 블루코끼리, 1개',
    description: '신축성 있는 소재로 만든 봄·가을용 올인원 실내복이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4c.coupangcdn.com/image/affiliate/banner/4b34947ddc296e63ee62520431569c73@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTKJc83dk', status: 'ON_SALE', createdAt,
  },
  {
    id: 82, name: '강아지 스트라이프 니트조끼 가을·겨울 외출복, 레드, 1개',
    description: '가을과 겨울 산책에 입히기 좋은 스트라이프 니트조끼예요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://static.coupangcdn.com/image/affiliate/banner/bc67d3a6c6fa6cbcc78b73588b6afc2d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTJ9XlNmK', status: 'ON_SALE', createdAt,
  },
  {
    id: 81, name: '모란빛케어 등똑딱 강아지 김장조끼 겨울옷, 꽃무늬 핑크, 1개',
    description: '털안감과 리드줄 연결고리가 있는 누빔 겨울 조끼예요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2c.coupangcdn.com/image/affiliate/banner/137320fd8b3a5855c824fe551274061d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTJTDPl4C', status: 'ON_SALE', createdAt,
  },
  {
    id: 80, name: '탐사 실속형 배변패드, 100개입, 2개',
    description: '실내 배변 공간을 위생적으로 관리하는 실속형 패드 2개 구성이에요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image9.coupangcdn.com/image/affiliate/banner/5d9dc0ab809af78fb376423acb48d3df@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTEkgfbem', status: 'ON_SALE', createdAt,
  },
  {
    id: 79, name: '탐사 반려동물 남아용 기저귀, 중형, 30개입, 1개',
    description: '중형 남아 반려견을 위한 위생 기저귀예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/b73912a563cb536eefea7987e86f9238@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTDByb0Y8', status: 'ON_SALE', createdAt,
  },
  {
    id: 78, name: '유한락스 반려동물 냄새·얼룩 제거제, 750ml, 1개',
    description: '반려동물 생활공간의 냄새와 얼룩을 청소하는 제거제예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2c.coupangcdn.com/image/affiliate/banner/aaca45ec7e522fd1e98218a0aea3a559@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTDajuT8u', status: 'ON_SALE', createdAt,
  },
  {
    id: 77, name: '붐붐포 반려동물 이어 클렌징 수딩 패드, 90ml, 1개',
    description: '귀 주변을 간편하게 닦아 관리하는 클렌징 패드예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/888bfe0e45086173d9ade560b9cbeaf7@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTCKiw13l', status: 'ON_SALE', createdAt,
  },
  {
    id: 76, name: '에티펫 반려동물용 눈·귀·입 아쿠아티슈 80p, 3개',
    description: '눈가와 귀, 입 주변을 닦는 반려동물용 아쿠아티슈예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/031d59fc94f7baf9caa10b6a4a77351b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTB09AuGW', status: 'ON_SALE', createdAt,
  },
  {
    id: 75, name: '허레이 반려동물 멜팅페이퍼 리필, 130개입, 2개',
    description: '멜팅페이퍼 본품에 보충해서 사용하는 리필 구성이에요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/473d8e3ac2768df46afc34ae4adb4de6@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTBDeB2T6', status: 'ON_SALE', createdAt,
  },
  {
    id: 74, name: '허레이 반려동물 멜팅페이퍼 본품, 130개입, 1개',
    description: '반려동물 위생 관리에 사용하는 멜팅페이퍼 본품이에요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/b858abafd132615b6ae511815488cc52@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTBdpwKrY', status: 'ON_SALE', createdAt,
  },
  {
    id: 73, name: '하울릭 강아지·고양이 피부관리 포비겔, 20g, 1개',
    description: '피부 관리가 필요한 반려동물을 위한 국소 사용 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/71a57b85224e956a8403e6b45e9c362c@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTANzCm96', status: 'ON_SALE', createdAt,
  },
  {
    id: 72, name: '몽셰펫 반려동물 덴탈 스프레이, 100ml, 1개',
    description: '입안과 치아를 간편하게 관리하는 뿌리는 덴탈 제품이에요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/240c543445183b99ecd3ad0683858759@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTArD5IoS', status: 'ON_SALE', createdAt,
  },
  {
    id: 71, name: '페터브 강아지·고양이 귀 세정 앰플, 50ml, 1개',
    description: '반려동물의 귀 주변을 세정하고 관리하는 앰플이에요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/ffac6969c0dfac91050992126c89cc49@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTz6WvCc8', status: 'ON_SALE', createdAt,
  },
  {
    id: 70, name: '더독 이어클리닝 패드 40p, 175g, 1개',
    description: '반려견의 귀 주변을 간편하게 닦는 이어클리닝 패드예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4c.coupangcdn.com/image/affiliate/banner/c549d03bd1bd9d0f49582b4f58de40a7@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTzLB2tcy', status: 'ON_SALE', createdAt,
  },
  {
    id: 69, name: '탐사 실속형 배변패드, 100개입, 1개',
    description: '실내 배변 공간을 위생적으로 관리하는 실속형 패드예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/5d444a496768f303cc6d9daaa91c153b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTzo3tX3s', status: 'ON_SALE', createdAt,
  },
  {
    id: 68, name: '베브랑 반려동물 피부 진정·보습 창상폼, 100g, 1개',
    description: '피부 진정과 보습 관리에 사용하는 동물용 의료기기 제품이에요.', category: 'HEALTH', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image14.coupangcdn.com/image/affiliate/banner/a6494f484b6bf54957964540032ac565@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTySMWxlA', status: 'ON_SALE', createdAt,
  },
  {
    id: 67, name: '아리코 실리콘 손가락 반려동물 칫솔, 투명, 20개',
    description: '손가락에 끼워 반려동물의 치아를 닦는 실리콘 칫솔이에요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image4.coupangcdn.com/image/affiliate/banner/09422c45293344a4bf56f8414cd525cc@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTyBbVzqe', status: 'ON_SALE', createdAt,
  },
  {
    id: 66, name: '댕냥픽 터그볼 움직이는 강아지 터그 공, 오렌지, 1개',
    description: '터그놀이와 공놀이를 함께 즐기는 움직이는 장난감이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image4.coupangcdn.com/image/affiliate/banner/a8ee82a86ac7da99d2af1d85be3a8659@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTp1gCyce', status: 'ON_SALE', createdAt,
  },
  {
    id: 65, name: '버디부 버디볼 프로 움직이는 강아지 노즈워크 간식공, 1개',
    description: '간식을 넣어 혼자서도 놀 수 있는 움직이는 노즈워크 볼이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2c.coupangcdn.com/image/affiliate/banner/c46afb04a4cdc366594dfbfd3d0249f1@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTpGckxBk', status: 'ON_SALE', createdAt,
  },
  {
    id: 64, name: '붐붐포 강아지 고슴도치 노즈워크 볼, 혼합색상, 1개',
    description: '간식을 숨겨 후각 활동을 돕는 고슴도치 모양 노즈워크 볼이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5c.coupangcdn.com/image/affiliate/banner/2f2a6baaae2cb118067d0e848ba22609@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTplPldCu', status: 'ON_SALE', createdAt,
  },
  {
    id: 63, name: '강아지 이갈이 삑삑이 애착인형 장난감, 혼합색, 8개',
    description: '이갈이와 놀이에 활용할 수 있는 삑삑이 인형 8개 세트예요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image10.coupangcdn.com/image/affiliate/banner/9ea0448a6d309858aeb64781f56d5e01@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTowUME8q', status: 'ON_SALE', createdAt,
  },
  {
    id: 62, name: '제이셀르 자동으로 움직이는 반려동물 공놀이 장난감, 레드, 1개',
    description: '자동으로 움직여 반려견의 놀이 활동을 돕는 공 장난감이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/8c01221733485e6a77effdf9b3fc3cab@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTn3KbKnY', status: 'ON_SALE', createdAt,
  },
  {
    id: 61, name: '냥멍하우스 바스락북 소리나는 신문책 장난감, 화이트&블랙, 3개',
    description: '바스락 소리로 호기심을 자극하는 신문책 모양 장난감이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image9.coupangcdn.com/image/affiliate/banner/3b93f2ed79572597686b3a6044829705@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTnnyTGbk', status: 'ON_SALE', createdAt,
  },
  {
    id: 60, name: '딩동펫 반려동물 캐롯 로프 실타래 장난감 6종 세트, 혼합색상',
    description: '물고 당기며 놀 수 있는 당근 모양 로프 장난감 세트예요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image9.coupangcdn.com/image/affiliate/banner/9284e34fbd313a078a1de0d21b363a1e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTmRYiBoW', status: 'ON_SALE', createdAt,
  },
  {
    id: 59, name: '에이치에스컴퍼니 강아지 실리콘 터그놀이 8종 세트, 블루스카이',
    description: '이갈이와 터그놀이에 활용하는 실리콘·로프 장난감 8종 세트예요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/de64f7467e9be3fa9807dba72260cbe0@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTlZytPoW', status: 'ON_SALE', createdAt,
  },
  {
    id: 58, name: '대왕오리 바스락 삑삑이 강아지 애착인형, 노랑, 1개',
    description: '바스락·삑삑 소리가 나는 대왕오리 모양 애착인형이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/150e1d72e24d574d902f5a28f9375b64@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTltIoLOS', status: 'ON_SALE', createdAt,
  },
  {
    id: 57, name: '디오벨러 삑삑이 애착인형 강아지 장난감, 동물, 3개',
    description: '삑삑 소리가 나는 동물 모양 애착인형 3개 세트예요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image15.coupangcdn.com/image/affiliate/banner/fb5ab9447ee8ab0bae1ea2f5dd5474a4@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTk3XB05k', status: 'ON_SALE', createdAt,
  },
  {
    id: 56, name: '꼬리온 강아지 바스락 삑삑이 장난감 5종 세트, 레드',
    description: '바스락 소리와 삑삑 소리를 함께 즐기는 장난감 5종 세트예요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4a.coupangcdn.com/image/affiliate/banner/ca98b3e695a0b78dab8923f59d3de9a7@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTkFidifI', status: 'ON_SALE', createdAt,
  },
  {
    id: 55, name: '슈퍼펫 강아지 인형공 노즈워크 장난감 코코볼, 아이보리, 1개',
    description: '인형공 사이에 간식을 숨길 수 있는 노즈워크 장난감이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image2.coupangcdn.com/image/affiliate/banner/d3f578d328f180d9479b741d18ebcfbb@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTjciRS8G', status: 'ON_SALE', createdAt,
  },
  {
    id: 54, name: '강아지 삼환 링 터그놀이 이갈이 장난감, 삼색, 1개',
    description: '물고 당기는 놀이와 이갈이 훈련에 활용하는 삼환 링 장난감이에요.', category: 'TOY', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1a.coupangcdn.com/image/affiliate/banner/76501213d9f43761984cc987c44920aa@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTiMNOaDk', status: 'ON_SALE', createdAt,
  },
  {
    id: 53, name: '굿데이 강아지 간식 오리가슴살 고구마 말이, 500g, 1개',
    description: '오리가슴살과 고구마를 함께 즐기는 말이형 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image7.coupangcdn.com/image/affiliate/banner/b615a10da0baff7151040b11e2fdd04f@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTbW3xOTc', status: 'ON_SALE', createdAt,
  },
  {
    id: 52, name: '듀먼 강아지 오븐 바삭 저염 수제간식, 황태, 40g, 1개',
    description: '오븐에 구운 저염 황태 수제간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5c.coupangcdn.com/image/affiliate/banner/dbe6dd63fecd0d0e8ac6160bafe871d2@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTbDpo7sy', status: 'ON_SALE', createdAt,
  },
  {
    id: 51, name: '미스터쿡 강아지 스테이크 건조간식, 소고기, 300g, 5개',
    description: '소고기 풍미의 스테이크형 건조간식 대용량 구성이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2c.coupangcdn.com/image/affiliate/banner/5b2f126a5c5d3d32b5986bd72370d26d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTbdsmb5o', status: 'ON_SALE', createdAt,
  },
  {
    id: 50, name: '졸리마켓 강아지 졸리의 행복한 간식 상점 껌, 오리우유껌, 1kg, 1개',
    description: '오리고기와 우유껌을 함께 즐기는 대용량 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/85914d3e370e9b26a34e6ff06be375f5@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTaSJmXwy', status: 'ON_SALE', createdAt,
  },
  {
    id: 49, name: '더조은 왕크다 강아지 대용량 육포 사사미, 치킨꽈배기, 1kg, 1개',
    description: '씹는 재미가 있는 치킨 꽈배기형 대용량 육포예요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/e2643b1a398dab887547820bcf977e48@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPTasct3wi', status: 'ON_SALE', createdAt,
  },
  {
    id: 48, name: '펫어스 강아지 잡고먹개 간식 21p, 혼합맛, 420g, 1개',
    description: '닭고기·오리고기·연어 세 가지 맛을 즐기는 혼합 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image12.coupangcdn.com/image/affiliate/banner/3d98cc359f630c93d58dec032307df08@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS95lrVqC', status: 'ON_SALE', createdAt,
  },
  {
    id: 47, name: '바른츄 강아지 소고기 육포 간식, 1.5kg, 1개',
    description: '소고기로 만든 대용량 육포 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/8256741086c9b9be8de13b853bab6147@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS9DIricS', status: 'ON_SALE', createdAt,
  },
  {
    id: 46, name: '멍식이네 맛있개먹개 대용량 강아지 간식껌, 오리말이고구마, 1kg, 1개',
    description: '고구마에 오리고기를 말아 만든 대용량 간식껌이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image10.coupangcdn.com/image/affiliate/banner/ab7d717d56c3aef448e4c139a3b2c38e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS82q8L6a', status: 'ON_SALE', createdAt,
  },
  {
    id: 45, name: '페페로니 강아지 진짜 져키, 소고기, 180g, 1개',
    description: '부드럽게 씹을 수 있는 소고기 져키 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4a.coupangcdn.com/image/affiliate/banner/cc6ab6cd442c6cfd272cd4080e40e8ec@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS8D1DAya', status: 'ON_SALE', createdAt,
  },
  {
    id: 44, name: '메디밀 반려동물 산양유단백 뉴트리션, 100ml, 10개',
    description: '유산균과 비타민을 더한 반려동물용 산양유 단백 음료예요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/6a7e0f600fa3e3f35a1701fa05d144e6@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS8ffquA0', status: 'ON_SALE', createdAt,
  },
  {
    id: 43, name: '펫봉봉 덴탈케어 강아지 덴탈껌 피부건강, 300g, 1개',
    description: '치아 관리와 피부 건강을 함께 고려한 츄잉스틱이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/ede9b6fa5fdc44d7caab8e7a8698f016@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS7L0Aq6K', status: 'ON_SALE', createdAt,
  },
  {
    id: 42, name: '굿데이 강아지 건강한 육포 닭가슴살 소프트스틱, 300g, 1개',
    description: '부드럽게 먹기 좋은 닭가슴살 소프트스틱이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image13.coupangcdn.com/image/affiliate/banner/c6e2053ef58a95cc75b99d1bb1ff13b9@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS7k0RxUy', status: 'ON_SALE', createdAt,
  },
  {
    id: 41, name: '페페로니 강아지 진짜 오메가3 져키, 연어, 180g, 1개',
    description: '연어와 오메가3를 담은 부드러운 져키 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image13.coupangcdn.com/image/affiliate/banner/574f0b3f7395b9ae06ec7c7570907140@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS60hRr4u', status: 'ON_SALE', createdAt,
  },
  {
    id: 40, name: '굿데이 강아지 건강한 육포 오리가슴살 스틱, 300g, 1개',
    description: '오리가슴살로 만든 스틱형 육포 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2a.coupangcdn.com/image/affiliate/banner/1e4c09ce81e055527cfd89e4f199aa82@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS6FDeqbY', status: 'ON_SALE', createdAt,
  },
  {
    id: 39, name: '펫봉봉 소프트 뉴트리 강아지 영양 간식 올인원 연어, 800g, 2개',
    description: '관절과 장 건강, 컨디션 케어를 고려한 연어 영양 간식이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image6.coupangcdn.com/image/affiliate/banner/21f8bb975716bcb823f32d19b7fda34d@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS6glXX3c', status: 'ON_SALE', createdAt,
  },
  {
    id: 38, name: '펫봉봉 스케일링 덴탈케어 강아지 덴탈껌, 320g, 1개',
    description: '치아 스케일링과 입냄새 관리를 돕는 츄잉스틱이에요.', category: 'SNACK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2a.coupangcdn.com/image/affiliate/banner/7bdc0ab083bb7558be4260930a7876c6@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPS0peU7DE', status: 'ON_SALE', createdAt,
  },
  {
    id: 37, name: '시저 어덜트 강아지 건식사료, 소, 1kg, 1개',
    description: '성견을 위한 소고기 풍미의 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/38f1fb6ca168463bc2b71ab0a39c0fee@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSROgSIxM', status: 'ON_SALE', createdAt,
  },
  {
    id: 36, name: '로얄캐닌 미니스타터 마더 베이비독 애견사료, 1kg, 1개',
    description: '소형견 어미와 어린 강아지를 위한 스타터 사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/5140bec50d6a4230c34ed6c11d73b1be@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSQ7U5uwK', status: 'ON_SALE', createdAt,
  },
  {
    id: 35, name: '로얄캐닌 미니 인도어 어덜트 건식사료, 3kg, 닭+오리, 1개',
    description: '실내 생활을 하는 소형 성견을 위한 닭·오리 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3a.coupangcdn.com/image/affiliate/banner/ddda438ad557d932ee6c8798863076ff@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSWnRRfMa', status: 'ON_SALE', createdAt,
  },
  {
    id: 34, name: '닥터도비 강아지 기능성 사료, 뼈·관절 강화, 5kg, 1개',
    description: '뼈와 관절 건강을 고려한 기능성 강아지 사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image9.coupangcdn.com/image/affiliate/banner/9dc28d40dedacd34fa2df30fda71d157@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSV0jPJGS', status: 'ON_SALE', createdAt,
  },
  {
    id: 33, name: '도그랑 전연령 강아지 클래식 건식사료, 닭, 5kg, 1개',
    description: '모든 연령의 강아지가 먹을 수 있는 닭고기 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1c.coupangcdn.com/image/affiliate/banner/0894137f95e9dceb7dc881cc7bf0aaca@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSUlBBTMG', status: 'ON_SALE', createdAt,
  },
  {
    id: 32, name: '본아페티 강아지 기능성 사료, 피부·피모·알러지, 1kg, 1개',
    description: '피부와 피모 건강, 알러지를 고려한 기능성 사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1a.coupangcdn.com/image/affiliate/banner/97116c867bbda360c0676c78b962db07@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSTRmb9oq', status: 'ON_SALE', createdAt,
  },
  {
    id: 31, name: '뉴트리나 건강백서 강아지 기능성 사료, 뼈·관절 강화, 2kg, 1개',
    description: '강아지의 뼈와 관절 건강을 고려한 기능성 사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image14.coupangcdn.com/image/affiliate/banner/29e2da920dc57e7cac1cf31e3f5fadd6@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSTqL8eUC', status: 'ON_SALE', createdAt,
  },
  {
    id: 30, name: '잘먹잘싸 6free 강아지 사료, 연어, 2kg, 1개',
    description: '연어를 사용한 6free 강아지 건식사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4a.coupangcdn.com/image/affiliate/banner/5bdbf994e033534601867d69a97be105@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSS21v9m8', status: 'ON_SALE', createdAt,
  },
  {
    id: 29, name: '마이펫닥터 강아지 시그니처 티어스 컨트롤 기능성 사료, 1kg, 1개',
    description: '눈물 자국과 눈 건강을 고려한 기능성 강아지 사료예요.', category: 'FOOD', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image1.coupangcdn.com/image/affiliate/banner/652f7b2d2e5bb5c8b619a60ce0f4a439@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSRXZu7GK', status: 'ON_SALE', createdAt,
  },
  {
    id: 28, name: '와우 강아지신발 숨쉬는 신나라슈즈 80매, 캐릭터팩, 1개',
    description: '산책할 때 발을 보호하는 일회용 강아지 신발이에요.', category: 'CLOTHING', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image11.coupangcdn.com/image/affiliate/banner/8fdd9d441830b432b5b1ea3d1167bfc4@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSJbgwNu8', status: 'ON_SALE', createdAt,
  },
  {
    id: 27, name: 'ZOZOFO 반려동물 휴대용 사료 급수기 2in1 물병+급식기, 화이트, 1개',
    description: '물과 사료를 따로 챙길 수 있는 산책용 2in1 급수·급식기예요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/e6b76d58838477c5b86fdd7a11af1dbc@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSFQZytlA', status: 'ON_SALE', createdAt,
  },
  {
    id: 26, name: '포조이 PawJoy 강아지 유모차 접이식 탈부착 대형, 그레이, 1개',
    description: '접이식·탈부착 구조의 대형 반려동물 유모차예요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2a.coupangcdn.com/image/affiliate/banner/69acf936a745295ec080537e2588abb5@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSD1P0pjg', status: 'ON_SALE', createdAt,
  },
  {
    id: 25, name: 'PawJoy 강아지 유모차 퀵폴딩 디럭스 레인커버, 카키',
    description: '빠르게 접을 수 있고 레인커버가 포함된 반려동물 유모차예요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/f918817320523f7fa585a34d11e944b3@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSCBFaC96', status: 'ON_SALE', createdAt,
  },
  {
    id: 24, name: '페피릴리프 대나무원단 애견 바디청결티슈 라벤더오일향, 10개입, 5개',
    description: '외출 후 반려견의 몸을 간편하게 닦는 바디 청결티슈예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image9.coupangcdn.com/image/affiliate/banner/029683e985854706729ea4a66ef640d8@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSBBWyeEm', status: 'ON_SALE', createdAt,
  },
  {
    id: 23, name: '탐사 반려동물 노워시 풋 버블 클렌저, 150ml, 2개',
    description: '물 없이 거품으로 산책 후 발을 관리하는 풋 클렌저예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img4c.coupangcdn.com/image/affiliate/banner/54a26e2086d4740205752971d88c2a2b@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSAmiYySi', status: 'ON_SALE', createdAt,
  },
  {
    id: 22, name: '딩동펫 반려견 LED 라이트 인식표 클립형 3p, 오렌지 + 옐로우 + 블루',
    description: '야간 산책 때 반려견의 위치를 쉽게 확인하는 LED 클립이에요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img5a.coupangcdn.com/image/affiliate/banner/5e0c9ff69f016f418ecdc7fbc7a6fb35@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSy4psDYq', status: 'ON_SALE', createdAt,
  },
  {
    id: 21, name: '럭키포우 고급형 꼬임방지 강아지 자동리드줄 5m, 크림 아이보리',
    description: '꼬임방지 구조와 원터치 브레이크를 갖춘 5m 자동 리드줄이에요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img2a.coupangcdn.com/image/affiliate/banner/212d195a0cad746c41a1cf5fd9a97903@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSxRdsLEO', status: 'ON_SALE', createdAt,
  },
  {
    id: 20, name: '펫트리움 자동 리드줄, 베이지 + 화이트, 1개',
    description: '편안한 산책을 위한 자동 길이 조절 리드줄이에요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://static.coupangcdn.com/image/affiliate/banner/b61e1aad654d58269be491cb819dcb1e@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSwJS1CU0', status: 'ON_SALE', createdAt,
  },
  {
    id: 19, name: 'Binmotor 강아지 산책 외출용 2in1 펫 물병, 400ml 핑크, 1개',
    description: '급수와 급식을 함께 해결하는 휴대용 2in1 산책 물병이에요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://img1a.coupangcdn.com/image/affiliate/banner/8d4d64728aec42e17feb634107c17581@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSu14kTxQ', status: 'ON_SALE', createdAt,
  },
  {
    id: 18, name: '퓨리가드 강아지 진드기·모기 기피 산책 스프레이, 50ml, 4개',
    description: '진드기와 모기가 걱정되는 계절에 사용하는 산책 전 기피 스프레이예요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image11.coupangcdn.com/image/affiliate/banner/fe8a3d94d297f8e6df3cdc7b0150c420@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSsB5S2Cq', status: 'ON_SALE', createdAt,
  },
  {
    id: 17, name: '포포몽 반려동물 산책 후엔 발티슈 캡형, 80개입, 2개',
    description: '산책을 마친 뒤 발과 몸을 간편하게 닦는 캡형 발티슈예요.', category: 'HYGIENE', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/4863df199b129046b65504866d5001fc@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSqBC7wvk', status: 'ON_SALE', createdAt,
  },
  {
    id: 16, name: '탐사 강아지 물통, 화이트, 1개',
    description: '산책 중 간편하게 물을 줄 수 있는 휴대용 강아지 물통이에요.', category: 'WALK', price: 0, stock: 0, soldOut: false,
    imageUrl: 'https://image5.coupangcdn.com/image/affiliate/banner/b6af5ce655cf322065f3fdbb7a1652d1@2x.jpg', affiliateUrl: 'https://link.coupang.com/a/iPSoHb5JSK', status: 'ON_SALE', createdAt,
  },
  {
    id: 15,
    name: '디스펜서 포함 대형 두꺼운 누수방지 딸기향 강아지 배변봉투 세트, 1세트, 120개입, 빨간색',
    description: '산책할 때 간편하게 챙기는 디스펜서 포함 배변봉투 세트예요.',
    category: 'WALK',
    price: 0,
    stock: 0,
    soldOut: false,
    imageUrl: 'https://image3.coupangcdn.com/image/affiliate/banner/6cda0fe0c28e81fc54d38bde3a501360@2x.jpg',
    affiliateUrl: 'https://link.coupang.com/a/iPSlySzmX6',
    status: 'ON_SALE',
    createdAt,
  },
  {
    id: 1,
    name: '라무달리 전연령 강아지 금동 건식사료, 가수분해연어, 2kg, 3개',
    description: '쿠팡 파트너스 공식 이미지와 링크를 연결한 추천 사료예요.',
    category: 'FOOD',
    price: 0,
    stock: 0,
    soldOut: false,
    imageUrl: 'https://img3c.coupangcdn.com/image/affiliate/banner/c9161dd721a4acf0b279f75728b920c0@2x.jpg',
    affiliateUrl: 'https://link.coupang.com/a/iPQ0MsMnBs',
    status: 'ON_SALE',
    createdAt,
  },
];
