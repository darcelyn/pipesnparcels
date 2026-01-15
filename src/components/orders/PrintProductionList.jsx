import React from 'react';
import { format } from 'date-fns';

export default function PrintProductionList({ selectedItems }) {
  return (
    <div className="p-8 bg-white text-black">
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 0.5in; }
        }
      `}</style>

      <div className="mb-6 text-center border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold mb-2">PRODUCTION LIST</h1>
        <p className="text-lg">Date: {format(new Date(), 'MM/dd/yyyy')}</p>
      </div>

      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 px-2 font-bold">Order #</th>
            <th className="text-left py-2 px-2 font-bold">Customer</th>
            <th className="text-left py-2 px-2 font-bold">Product Code</th>
            <th className="text-left py-2 px-2 font-bold">Special Options</th>
            <th className="text-center py-2 px-2 font-bold">Qty</th>
            <th className="text-center py-2 px-2 font-bold">✓</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-400">
              <td className="py-3 px-2 font-mono text-sm">{item.order_number}</td>
              <td className="py-3 px-2">{item.customer_name}</td>
              <td className="py-3 px-2 font-bold text-lg">{item.shorthand || item.sku}</td>
              <td className="py-3 px-2 text-sm">{item.special_options || '-'}</td>
              <td className="py-3 px-2 text-center font-bold text-lg">{item.quantity}</td>
              <td className="py-3 px-2 text-center">
                <div className="w-6 h-6 border-2 border-black mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 border-t-2 border-black pt-4">
        <p className="text-sm"><strong>Total Items:</strong> {selectedItems.length}</p>
        <p className="text-sm mt-2"><strong>Completed by:</strong> _______________________</p>
      </div>
    </div>
  );
}