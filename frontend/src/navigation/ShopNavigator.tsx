import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { MarketScreen } from '../screens/shop/MarketScreen';
import { ProductDetailScreen } from '../screens/shop/ProductDetailScreen';
import { CartScreen } from '../screens/shop/CartScreen';
import { CheckoutScreen } from '../screens/shop/CheckoutScreen';
import { PaymentScreen } from '../screens/shop/PaymentScreen';
import { OrderListScreen } from '../screens/shop/OrderListScreen';
import { OrderDetailScreen } from '../screens/shop/OrderDetailScreen';

// 마켓 탭 내부 이동: 홈 → 상세 → 장바구니 → 주문서 → 결제 → 주문 상세
export type ShopStackParamList = {
  MarketHome: undefined;
  ProductDetail: { productId: number };
  Cart: undefined;
  // cartItemIds(장바구니 주문) 또는 items(바로 구매) 중 하나
  Checkout: { cartItemIds: number[] } | { items: { productId: number; quantity: number }[] };
  Payment: { orderNo: string };
  OrderList: undefined;
  OrderDetail: { orderNo: string; justPaid?: boolean };
};

export type ShopScreenProps<Name extends keyof ShopStackParamList> = NativeStackScreenProps<ShopStackParamList, Name>;

const Stack = createNativeStackNavigator<ShopStackParamList>();

export function ShopNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketHome" component={MarketScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      {/* 결제 중 뒤로 스와이프로 빠져나가지 않도록 제스처 비활성 */}
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="OrderList" component={OrderListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}
