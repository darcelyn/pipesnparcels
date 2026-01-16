import React from 'react';
import { format } from 'date-fns';

function PrintOrderList({ orders }) {
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

        {orders.map((order) => (
          <div key={order.id} className="mb-8 break-inside-avoid">
            <div className="bg-gray-100 px-4 py-2 font-bold border border-gray-300 flex justify-between items-center">
              <span>Order #{order.order_number} - {order.customer_name}</span>
              <span className="text-sm font-normal">
                {order.shipping_address?.city}, {order.shipping_address?.state} • {order.priority?.toUpperCase()}
              </span>
            </div>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left w-12">☐</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">SKU</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Part Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Options</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-3 py-2">☐</td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {item.sku || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {item.name || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {item.options || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {order.special_instructions && (
              <div className="border border-gray-300 border-t-0 px-4 py-2 bg-yellow-50 text-sm">
                <strong>Special Instructions:</strong> {order.special_instructions}
              </div>
            )}
          </div>
        ))}


      </div>
    </div>
  );
}

export default PrintOrderList;