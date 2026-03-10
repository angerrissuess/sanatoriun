import React, { useState, useEffect } from 'react';

export default function HotelMap({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/map')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col relative overflow-hidden">
        <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
          <h2 className="text-2xl font-serif text-stone-800">Карта отеля</h2>
          <div className="flex space-x-4 text-sm mr-8">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Свободно</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Забронирован</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Занято</div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition"
          >
            ✕
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 bg-stone-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {data.rooms.map((r: any) => {
              const today = new Date().toISOString().split('T')[0];
              const activeBooking = data.bookings.find((b: any) => b.roomId === r.id && b.checkIn <= today && b.checkOut >= today);
              const pendingBooking = data.bookings.find((b: any) => b.roomId === r.id && b.status === 'Pending' && b.checkIn > today);
              
              let statusColor = 'bg-white border-emerald-200 text-emerald-700';
              let statusDot = 'bg-emerald-500';
              let statusText = 'Свободно';
              
              if (activeBooking) {
                statusColor = 'bg-white border-red-200 text-red-700 opacity-75';
                statusDot = 'bg-red-500';
                statusText = 'Занято';
              } else if (pendingBooking) {
                statusColor = 'bg-white border-amber-200 text-amber-700';
                statusDot = 'bg-amber-500';
                statusText = 'Забронирован';
              }

              return (
                <div key={r.id} className={`p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${statusColor}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl font-bold text-stone-800">{r.roomNumber}</span>
                    <span className={`w-3 h-3 rounded-full ${statusDot} shadow-sm`}></span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-stone-700">{r.type}</p>
                    <p className="text-xs text-stone-500">Вместимость: {r.capacity} чел.</p>
                    <p className={`text-xs font-medium mt-3 pt-3 border-t border-stone-100 ${
                      activeBooking ? 'text-red-600' : pendingBooking ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{statusText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
