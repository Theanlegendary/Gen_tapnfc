import { GuestConnectionsScreen } from '@/src/features/guest/GuestConnectionsScreen';
import { OrdersQueueScreen } from '@/src/features/orders/OrdersQueueScreen';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export default function OrdersQueueTabRoute() {
  const isGuest = useIsGuest();
  if (isGuest) {
    return <GuestConnectionsScreen />;
  }
  return <OrdersQueueScreen />;
}

