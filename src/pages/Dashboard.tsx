import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import MenuManager from '../components/MenuManager';

interface Table {
  id: string;
  number: number;
  orders: any[];
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { orders, subscribeToOrders, updateOrderStatus } = useOrderStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [showOrders, setShowOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'menu'>('tables');

  useEffect(() => {
    if (user) {
      loadTables();
      const unsubscribe = subscribeToOrders(user.uid);
      return () => unsubscribe();
    }
  }, [user]);

  const loadTables = async () => {
    const tablesQuery = query(collection(db, 'tables'), where('restaurantId', '==', user.uid));
    const snapshot = await getDocs(tablesQuery);
    const tablesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Table[];
    setTables(tablesList.sort((a, b) => a.number - b.number));
  };

  const addTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tableNumber = parseInt(newTableNumber);
      await addDoc(collection(db, 'tables'), {
        number: tableNumber,
        restaurantId: user.uid,
        orders: [],
        createdAt: new Date().toISOString(),
      });
      setNewTableNumber('');
      loadTables();
      toast.success('Table added successfully!');
    } catch (error: any) {
      toast.error('Error adding table');
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      await deleteDoc(doc(db, 'tables', tableId));
      loadTables();
      toast.success('Table deleted successfully!');
    } catch (error: any) {
      toast.error('Error deleting table');
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Restaurant Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowOrders(!showOrders)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Bell className="h-5 w-5 mr-2" />
            Orders {pendingOrders.length > 0 && `(${pendingOrders.length})`}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'tables'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tables
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'menu'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu
          </button>
        </nav>
      </div>

      {showOrders && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {orders.map((order) => (
                <li key={order.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Table {tables.find(t => t.id === order.tableId)?.number} - {order.customerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: ${order.total.toFixed(2)} - Status: {order.status}
                      </p>
                      <div className="mt-2">
                        {order.items.map((item, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            {item.quantity}x {item.name} - ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.tableId, order, 'preparing')}
                            className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.tableId, order, 'cancelled')}
                            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.tableId, order, 'completed')}
                          className="bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'tables' ? (
        <>
          <form onSubmit={addTable} className="mt-8 flex gap-4">
            <input
              type="number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Enter table number"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Table
            </button>
          </form>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Table {table.number}</h3>
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/table/${user.uid}/${table.id}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Active Orders: {table.orders?.filter(o => o.status === 'pending' || o.status === 'preparing').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <MenuManager restaurantId={user.uid} />
      )}
    </div>
  );
}