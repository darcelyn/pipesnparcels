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

      <div className="mb-3 text-center border-b border-black pb-2">
        <h1 className="text-lg font-bold">PRODUCTION LIST</h1>
        <p className="text-xs">Date: {format(new Date(), 'MM/dd/yyyy')}</p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1 px-1 font-bold w-20">Order #</th>
            <th className="text-left py-1 px-1 font-bold w-24">Customer</th>
            <th className="text-left py-1 px-1 font-bold">Product</th>
            <th className="text-left py-1 px-1 font-bold w-32">SKU</th>
            <th className="text-center py-1 px-1 font-bold w-12">Qty</th>
            <th className="text-center py-1 px-1 font-bold w-12">✓</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-1 px-1">{item.order_number}</td>
              <td className="py-1 px-1 truncate">{item.customer_name}</td>
              <td className="py-1 px-1">
                <div className="font-semibold">{item.shorthand || item.name}</div>
                {item.special_options && (
                  <div className="text-gray-600">{item.special_options}</div>
                )}
              </td>
              <td className="py-1 px-1 font-mono text-xs">{item.sku}</td>
              <td className="py-1 px-1 text-center font-bold">{item.quantity}</td>
              <td className="py-1 px-1 text-center">
                <div className="w-4 h-4 border border-black inline-block"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 border-t border-black pt-2">
        <p className="text-xs"><strong>Total Items:</strong> {selectedItems.length} | <strong>Completed by:</strong> _______________________</p>
      </div>
    </div>
  );
}