import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { MarketScreen } from '../screens/shop/MarketScreen';

// 1차 출시에서는 자체 주문/결제를 제공하지 않고 쿠팡 제휴 추천관만 노출한다.
export type ShopStackParamList = {
  MarketHome: undefined;
  // 아래 화면은 향후 자체 쇼핑 전환을 위해 타입만 유지한다. 1차 출시 네비게이터에는 등록하지 않는다.
  ProductDetail: { productId: number };
  Cart: undefined;
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
    </Stack.Navigator>
  );
}
