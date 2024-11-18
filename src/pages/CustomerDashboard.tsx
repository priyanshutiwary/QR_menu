import React, { useState, useEffect } from 'react';
import { QrCode, History, Star, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [showScanner, setShowScanner] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  useEffect(() => {
    if (user) {
      loadOrderHistory();
      loadFavoriteRestaurants();
    }
  }, [user]);

  useEffect(() => {
    let scanner: any = null;
    
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(success, error);
      
      function success(result: string) {
        scanner.clear();
        setShowScanner(false);
        
        try {
          // Extract restaurant and table IDs from QR code URL
          const url = new URL(result);
          const pathParts = url.pathname.split('/');
          const restaurantId = pathParts[2];
          const tableId = pathParts[3];
          
          // Navigate to order page
          window.location.href = `/table/${restaurantId}/${tableId}`;
        } catch (err) {
          toast.error('Invalid QR code');
        }
      }
      
      function error(err: any) {
        console.error(err);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [showScanner]);

  const loadOrderHistory = async () => {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(ordersQuery);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrderHistory(orders);
  };

  const loadFavoriteRestaurants = async () => {
    const favsQuery = query(
      collection(db, 'favorites'),
      where('customerId', '==', user.uid)
    );
    const snapshot = await getDocs(favsQuery);
    const favs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFavoriteRestaurants(favs);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Scan a QR code to start ordering</p>
      </div>

      {!showScanner ? (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full mb-8 p-4 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 flex items-center justify-center space-x-2 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
        >
          <QrCode className="h-6 w-6" />
          <span>Tap to scan QR code</span>
        </button>
      ) : (
        <div className="mb-8">
          <div className="relative">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-2 right-2 z-10 bg-white rounded-full p-2"
            >
              ✕
            </button>
            <div id="qr-reader" className="w-full"></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'history'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="h-5 w-5 inline mr-2" />
              Order History
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star className="h-5 w-5 inline mr-2" />
              Favorite Restaurants
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'history' ? (
            <div className="space-y-4">
              {orderHistory.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{order.restaurantName}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    {order.items.map((item: any, index: number) => (
                      <p key={index} className="text-sm text-gray-600">
                        {item.quantity}x {item.name}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{restaurant.businessName}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {restaurant.address}
                      </p>
                    </div>
                    <button className="text-red-500 hover:text-red-700">
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}