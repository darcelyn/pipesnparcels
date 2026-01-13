import React from 'react';
import { format } from 'date-fns';
import { Package, MapPin } from 'lucide-react';

export default function PackingList({ order }) {
  const address = order.shipping_address || {};

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-4">
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .packing-list, .packing-list * {
            visibility: visible;
          }
          .packing-list {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
      
      <div className="packing-list">
        {/* Header */}
        <div className="border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">PACKING LIST</h1>
              <p className="text-lg text-slate-600">Order #{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Date</p>
              <p className="font-semibold text-slate-900">{format(new Date(), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Ship To Address */}
        <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
            <h2 className="text-lg font-semibold text-slate-900">Ship To:</h2>
          </div>
          <div className="ml-7">
            <p className="font-semibold text-slate-900 text-lg">{order.customer_name}</p>
            {address.street1 && <p className="text-slate-700">{address.street1}</p>}
            {address.street2 && <p className="text-slate-700">{address.street2}</p>}
            <p className="text-slate-700">
              {address.city}, {address.state} {address.zip}
            </p>
            {address.country && <p className="text-slate-700">{address.country}</p>}
            {address.phone && (
              <p className="text-slate-700 mt-2">Phone: {address.phone}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Items to Pack</h2>
          </div>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-left p-3 font-semibold">SKU</th>
                <th className="text-left p-3 font-semibold">Item Description</th>
                <th className="text-center p-3 font-semibold">Qty</th>
                <th className="text-center p-3 font-semibold">Weight (each)</th>
                <th className="text-center p-3 font-semibold">Packed ✓</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 text-slate-900 font-mono text-sm">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-900 font-medium">
                      {item.name}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block bg-teal-100 text-teal-900 px-4 py-1 rounded-full font-bold text-lg">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-700">
                      {item.weight ? `${item.weight} lbs` : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-slate-400 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    No items to pack
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm text-slate-600">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">
              {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Weight</p>
            <p className="text-2xl font-bold text-slate-900">
              {order.total_weight ? `${order.total_weight} lbs` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              ⚠️ Special Instructions
            </h3>
            <p className="text-amber-900">{order.special_instructions}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-slate-200 pt-4 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-slate-600 mb-2">Packed By:</p>
              <div className="border-b-2 border-slate-300 h-8"></div>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Date Packed:</p>
              <div className="border-b-2 border-slate-300 h-8"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}