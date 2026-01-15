import React from 'react';
import { format } from 'date-fns';

export default function PrintProductionList({ selectedItems }) {
  return (
    <div className="p-6 bg-white text-black">
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 0.3in; }
        }
      `}</style>

      <div className="mb-4 text-center border-b border-black pb-2">
        <h1 className="text-xl font-bold">PRODUCTION LIST</h1>
        <p className="text-sm">Date: {format(new Date(), 'MM/dd/yyyy')}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1 px-2 font-bold w-32">Order Number</th>
            <th className="text-center py-1 px-2 font-bold w-24">Check Box</th>
            <th className="text-left py-1 px-2 font-bold">Item Name + short hand if available</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-1 px-2">{item.order_number}</td>
              <td className="py-1 px-2 text-center">Check Box</td>
              <td className="py-1 px-2">
                {item.shorthand || item.name}
                {item.special_options && ` - ${item.special_options}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 border-t border-black pt-2">
        <p className="text-xs"><strong>Total Items:</strong> {selectedItems.length}</p>
        <p className="text-xs mt-1"><strong>Completed by:</strong> _______________________</p>
      </div>
    </div>
  );
}