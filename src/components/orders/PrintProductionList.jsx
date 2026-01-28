import React from 'react';
import { format } from 'date-fns';

export default function PrintProductionList({ selectedItems }) {
  return (
    <div className="p-4 bg-white text-black">
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 0.3in; }
        }
      `}</style>

      <div className="mb-4">
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-xl font-bold uppercase">Daily Production List</h1>
          <p className="text-sm mt-1">{format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 px-2 font-bold">Order</th>
            <th className="text-left py-2 px-2 font-bold">Customer</th>
            <th className="text-left py-2 px-2 font-bold">Code</th>
            <th className="text-center py-2 px-2 font-bold w-16">Qty</th>
            <th className="text-left py-2 px-2 font-bold">Options</th>
            <th className="text-left py-2 px-2 font-bold w-32">Notes</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-400">
              <td className="py-2 px-2 font-mono text-xs">#{item.order_number}</td>
              <td className="py-2 px-2">{item.customer_name}</td>
              <td className="py-2 px-2 font-bold uppercase">{item.shorthand || item.sku}</td>
              <td className="py-2 px-2 text-center font-bold text-base">{item.quantity}</td>
              <td className="py-2 px-2 text-xs">{item.special_options || '-'}</td>
              <td className="py-2 px-2 border-l border-gray-300"></td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-6 text-xs text-gray-600">
        <p>Total Items: {selectedItems.length}</p>
      </div>
    </div>
  );
}