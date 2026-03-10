/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PublicPortal from './components/PublicPortal';
import AdminDashboard from './components/AdminDashboard';
import HotelMap from './components/HotelMap';

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowLogin(true);
      }
    };
    const handleOpenMap = () => setShowMap(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-map', handleOpenMap);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-map', handleOpenMap);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setAdminToken(data.token);
        setShowLogin(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Ошибка соединения');
    }
  };

  if (adminToken) {
    return <AdminDashboard token={adminToken} onLogout={() => setAdminToken(null)} />;
  }

  return (
    <>
      <PublicPortal />
      
      {showMap && <HotelMap onClose={() => setShowMap(false)} />}

      {/* Admin Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-serif text-center mb-6 text-stone-800">Вход для администратора</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Логин</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Пароль</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-full hover:bg-stone-800 transition mt-2">
                Войти
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
