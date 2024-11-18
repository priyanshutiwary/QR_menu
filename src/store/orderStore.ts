import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  items: OrderItem[];
  customerName: string;
  tableId: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  total: number;
  createdAt: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderStore {
  orders: Order[];
  loading: boolean;
  subscribeToOrders: (restaurantId: string) => () => void;
  updateOrderStatus: (tableId: string, order: Order, newStatus: Order['status']) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  loading: true,
  subscribeToOrders: (restaurantId) => {
    const tablesQuery = query(
      collection(db, 'tables'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(tablesQuery, (snapshot) => {
      const allOrders: Order[] = [];
      snapshot.docs.forEach((doc) => {
        const tableData = doc.data();
        if (tableData.orders) {
          tableData.orders.forEach((order: Order) => {
            allOrders.push({ ...order, id: doc.id });
          });
        }
      });

      set({
        orders: allOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        loading: false
      });

      // Show notification for new pending orders
      const pendingOrders = allOrders.filter(order => order.status === 'pending');
      if (pendingOrders.length > 0) {
        toast.success(`New order${pendingOrders.length > 1 ? 's' : ''} received!`, {
          duration: 5000,
        });
      }
    });

    return unsubscribe;
  },
  updateOrderStatus: async (tableId, order, newStatus) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      await updateDoc(tableRef, {
        orders: arrayRemove(order)
      });
      await updateDoc(tableRef, {
        orders: arrayUnion({ ...order, status: newStatus })
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Error updating order status');
    }
  }
}));