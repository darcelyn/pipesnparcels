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
        <h1 className="text-sm font-bold">{format(new Date(), 'MM/dd/yyyy')} | Daily Production List</h1>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1 px-1 font-bold">Order #</th>
            <th className="text-left py-1 px-1 font-bold">Item Name</th>
            <th className="text-center py-1 px-1 font-bold">Qty</th>
            <th className="text-left py-1 px-1 font-bold">Special Options</th>
            <th className="text-left py-1 px-1 font-bold">Order Options</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-1 px-1">{item.order_number}</td>
              <td className="py-1 px-1">{item.shorthand || item.name}</td>
              <td className="py-1 px-1 text-center">{item.quantity}</td>
              <td className="py-1 px-1">{item.special_options || ''}</td>
              <td className="py-1 px-1"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}