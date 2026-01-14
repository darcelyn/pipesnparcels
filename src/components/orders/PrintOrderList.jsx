import React from 'react';
import { format } from 'date-fns';

export default function PrintOrderList({ orders }) {
  return (
    <div className="print:block hidden">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      
      <div id="print-section" className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Order List</h1>
          <p className="text-sm text-gray-600">
            Printed: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </p>
          <p className="text-sm text-gray-600">Total Orders: {orders.length}</p>
        </div>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">☐</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Order #</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Customer</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Location</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Items</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Weight</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Priority</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="border border-gray-300 px-3 py-2">☐</td>
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {order.order_number}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {order.customer_name}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {order.shipping_address?.city}, {order.shipping_address?.state}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {order.items?.length || 0}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {order.total_weight ? `${order.total_weight} lbs` : '-'}
                </td>
                <td className="border border-gray-300 px-3 py-2 uppercase text-xs">
                  {order.priority}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.some(o => o.special_instructions) && (
          <div className="mt-6">
            <h2 className="font-bold mb-2">Special Instructions:</h2>
            {orders.filter(o => o.special_instructions).map((order) => (
              <div key={order.id} className="mb-2">
                <strong>#{order.order_number}:</strong> {order.special_instructions}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}