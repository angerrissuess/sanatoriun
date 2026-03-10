import React, { useState, useEffect } from 'react';
import { Users, LayoutDashboard, CalendarDays, Activity, Search, LogOut } from 'lucide-react';

export default function AdminDashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<any>(null);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/admin/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setData)
    .catch(console.error);
  }, [token]);

  const handleDeleteGuest = async (id: number) => {
    if (!window.confirm('Вы уверены? Это удалит клиента и ВСЕ его путевки и процедуры!')) return;
    try {
      const res = await fetch(`/api/admin/guests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const newDataRes = await fetch('/api/admin/data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const newData = await newDataRes.json();
        setData(newData);
      } else {
        alert('Ошибка при удалении на сервере');
      }
    } catch (err) {
      alert('Ошибка соединения');
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/guests/${editingGuest.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingGuest)
      });
      if (res.ok) {
        setData({
          ...data,
          guests: data.guests.map((g: any) => g.id === editingGuest.id ? editingGuest : g)
        });
        setEditingGuest(null);
      }
    } catch (err) {
      alert('Ошибка при сохранении');
    }
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-stone-100">Загрузка...</div>;

  const filteredGuests = data.guests.filter((g: any) => 
    g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sky-900 text-stone-300 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-serif text-white">Белые ночи</h2>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Панель управления</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'hover:bg-stone-800'}`}>
            <LayoutDashboard size={20} /> <span>Дашборд</span>
          </button>
          <button onClick={() => setActiveTab('guests')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${activeTab === 'guests' ? 'bg-sky-600 text-white' : 'hover:bg-stone-800'}`}>
            <Users size={20} /> <span>Клиенты</span>
          </button>
          <button onClick={() => setActiveTab('rooms')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${activeTab === 'rooms' ? 'bg-sky-600 text-white' : 'hover:bg-stone-800'}`}>
            <CalendarDays size={20} /> <span>Шахматка</span>
          </button>
          <button onClick={() => setActiveTab('procedures')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition ${activeTab === 'procedures' ? 'bg-sky-600 text-white' : 'hover:bg-stone-800'}`}>
            <Activity size={20} /> <span>Процедуры</span>
          </button>
        </nav>
        <div className="p-4">
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-sky-800 hover:bg-sky-700 rounded-2xl transition text-sm">
            <LogOut size={16} /> <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-stone-800">Обзор</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                <p className="text-sm text-stone-500 mb-1">Заполняемость</p>
                <p className="text-3xl font-light text-sky-600">{data.stats.occupancy}%</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                <p className="text-sm text-stone-500 mb-1">Заезды сегодня</p>
                <p className="text-3xl font-light text-stone-800">{data.stats.todayArrivals}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                <p className="text-sm text-stone-500 mb-1">Новые заявки</p>
                <p className="text-3xl font-light text-amber-600">{data.stats.pendingApplications}</p>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-stone-800 mt-8 mb-4">Последние бронирования</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Клиент</th>
                    <th className="px-6 py-4 font-medium">Номер</th>
                    <th className="px-6 py-4 font-medium">Заезд</th>
                    <th className="px-6 py-4 font-medium">Выезд</th>
                    <th className="px-6 py-4 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.bookings.slice(0, 5).map((b: any) => (
                    <tr key={b.id}>
                      <td className="px-6 py-4">{b.fullName}</td>
                      <td className="px-6 py-4">{b.roomNumber}</td>
                      <td className="px-6 py-4">{b.checkIn}</td>
                      <td className="px-6 py-4">{b.checkOut}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${b.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                          {b.status === 'Pending' ? 'Ожидает' : 'Подтверждено'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-stone-800">База клиентов</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Поиск по имени или телефону..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 outline-none w-80"
                />
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">ФИО</th>
                    <th className="px-6 py-4 font-medium">Телефон</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredGuests.map((g: any) => (
                    <tr key={g.id}>
                      <td className="px-6 py-4 text-stone-500">#{g.id}</td>
                      <td className="px-6 py-4 font-medium text-stone-800">{g.fullName}</td>
                      <td className="px-6 py-4">{g.phone}</td>
                      <td className="px-6 py-4">{g.email || '-'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setEditingGuest(g)} className="text-sky-600 hover:text-sky-800 mr-3 transition">Ред.</button>
                        <button onClick={() => handleDeleteGuest(g.id)} className="text-red-600 hover:text-red-800 transition">Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-stone-800">Шахматка номеров</h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="flex border-b border-stone-200 pb-2 mb-4">
                  <div className="w-48 flex-shrink-0 font-medium text-stone-500 pr-4">Номер</div>
                  <div className="flex-1 flex justify-between text-sm text-stone-400 px-4">
                    <span>1 Мая</span>
                    <span>5 Мая</span>
                    <span>10 Мая</span>
                    <span>15 Мая</span>
                    <span>20 Мая</span>
                    <span>25 Мая</span>
                    <span>30 Мая</span>
                  </div>
                </div>
                {data.rooms.map((r: any) => {
                  const roomBookings = data.bookings.filter((b: any) => b.roomId === r.id);
                  return (
                    <div key={r.id} className="flex items-center mb-4 relative h-10">
                      <div className="w-48 flex-shrink-0 font-medium text-stone-800 flex flex-col pr-4">
                        <span>{r.roomNumber}</span>
                        <span className="text-xs text-stone-400">{r.type}</span>
                      </div>
                      <div className="flex-1 bg-stone-50 rounded-lg relative h-full border border-stone-100 overflow-hidden">
                        {roomBookings.map((b: any) => {
                          const startDay = parseInt(b.checkIn.split('-')[2] || '1');
                          const endDay = parseInt(b.checkOut.split('-')[2] || '5');
                          const left = `${(startDay / 31) * 100}%`;
                          const width = `${((endDay - startDay) / 31) * 100}%`;
                          
                          return (
                            <div 
                              key={b.id} 
                              className="absolute top-1 bottom-1 bg-sky-500 rounded-md shadow-sm flex items-center px-2 text-xs text-white truncate cursor-pointer hover:bg-sky-400 transition"
                              style={{ left, width }}
                              title={`${b.fullName} (${b.checkIn} - ${b.checkOut})`}
                            >
                              {b.fullName}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ... (остальные вкладки map, procedures и модалка без изменений) */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-stone-800">Карта отеля</h2>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Свободно</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Забронирован</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Занято</div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {data.rooms.map((r: any) => {
                  const today = new Date().toISOString().split('T')[0];
                  const activeBooking = data.bookings.find((b: any) => b.roomId === r.id && b.checkIn <= today && b.checkOut >= today);
                  const pendingBooking = data.bookings.find((b: any) => b.roomId === r.id && b.status === 'Pending' && b.checkIn > today);
                  
                  let statusColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                  let statusDot = 'bg-emerald-500';
                  let statusText = 'Свободно';
                  
                  if (activeBooking) {
                    statusColor = 'bg-red-50 border-red-200 text-red-700';
                    statusDot = 'bg-red-500';
                    statusText = 'Занято';
                  } else if (pendingBooking) {
                    statusColor = 'bg-amber-50 border-amber-200 text-amber-700';
                    statusDot = 'bg-amber-500';
                    statusText = 'Забронирован';
                  }

                  return (
                    <div key={r.id} className={`p-6 rounded-2xl border-2 transition-all hover:shadow-md ${statusColor}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-2xl font-bold">{r.roomNumber}</span>
                        <span className={`w-3 h-3 rounded-full ${statusDot}`}></span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium opacity-90">{r.type}</p>
                        <p className="text-xs opacity-75">Вместимость: {r.capacity} чел.</p>
                        <p className="text-xs opacity-75 mt-2 pt-2 border-t border-current">{statusText}</p>
                        {activeBooking && <p className="text-xs font-medium mt-1 truncate">{activeBooking.fullName}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'procedures' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-stone-800">Расписание процедур</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Время</th>
                    <th className="px-6 py-4 font-medium">Процедура</th>
                    <th className="px-6 py-4 font-medium">Клиент</th>
                    <th className="px-6 py-4 font-medium">Номер</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.procedureSchedules.map((ps: any) => (
                    <tr key={ps.id}>
                      <td className="px-6 py-4 font-medium text-stone-800">{ps.scheduledAt}</td>
                      <td className="px-6 py-4 text-sky-700">{ps.procedureName}</td>
                      <td className="px-6 py-4">{ps.guestName}</td>
                      <td className="px-6 py-4">{ps.roomNumber}</td>
                    </tr>
                  ))}
                  {data.procedureSchedules.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-stone-500">Нет запланированных процедур</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {editingGuest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl w-96 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 text-stone-800">Редактировать клиента</h3>
              <form onSubmit={handleUpdateGuest} className="space-y-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">ФИО</label>
                  <input required className="w-full border p-3 rounded-2xl border-stone-300 focus:ring-2 focus:ring-sky-500 outline-none" value={editingGuest.fullName} onChange={e => setEditingGuest({...editingGuest, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Телефон</label>
                  <input required className="w-full border p-3 rounded-2xl border-stone-300 focus:ring-2 focus:ring-sky-500 outline-none" value={editingGuest.phone} onChange={e => setEditingGuest({...editingGuest, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Email</label>
                  <input className="w-full border p-3 rounded-2xl border-stone-300 focus:ring-2 focus:ring-sky-500 outline-none" value={editingGuest.email || ''} onChange={e => setEditingGuest({...editingGuest, email: e.target.value})} />
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setEditingGuest(null)} className="px-5 py-2.5 rounded-full text-stone-600 hover:bg-stone-100 transition">Отмена</button>
                  <button type="submit" className="px-5 py-2.5 rounded-full bg-sky-600 text-white hover:bg-sky-500 transition shadow-md">Сохранить</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
