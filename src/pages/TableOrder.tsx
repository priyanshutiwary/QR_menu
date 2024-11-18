import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { UtensilsCrossed, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function TableOrder() {
  const { restaurantId, tableId } = useParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadRestaurantAndMenu();
  }, [restaurantId]);

  const loadRestaurantAndMenu = async () => {
    try {
      if (!restaurantId) return;
      
      const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
      const menuDoc = await getDoc(doc(db, 'menus', restaurantId));
      
      if (!restaurantDoc.exists()) {
        toast.error('Restaurant not found');
        return;
      }

      const menuData = menuDoc.data()?.items || [];
      const uniqueCategories = Array.from(new Set(menuData.map((item: MenuItem) => item.category)));
      
      setRestaurant(restaurantDoc.data());
      setMenu(menuData);
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (error) {
      toast.error('Error loading menu');
      setLoading(false);
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuItemId === menuItem.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }];
    });
    toast.success(`Added ${menuItem.name} to cart`);
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuItemId === menuItemId);
      if (existingItem?.quantity === 1) {
        return prevCart.filter(item => item.menuItemId !== menuItemId);
      }
      return prevCart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const placeOrder = async () => {
    if (!customerName) {
      toast.error('Please enter your name');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const order = {
        items: cart,
        customerName,
        tableId,
        status: 'pending',
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        createdAt: new Date().toISOString()
      };

      const tableRef = doc(db, 'tables', tableId!);
      await updateDoc(tableRef, {
        orders: arrayUnion(order)
      });

      setCart([]);
      setCustomerName('');
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error('Error placing order');
    }
  };

  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <UtensilsCrossed className="h-12 w-12 text-indigo-600 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{restaurant?.businessName}</h1>
          <p className="mt-2 text-lg text-gray-600">Table Order System</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-6 flex overflow-x-auto space-x-2 pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <p className="text-gray-600">{item.description}</p>
                  <p className="text-indigo-600 font-medium">${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg sticky top-4">
            <h2 className="text-2xl font-bold mb-4">Your Order</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-600">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4 text-red-600" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart({ id: item.menuItemId, name: item.name, price: item.price } as MenuItem)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={placeOrder}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 mt-4"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}