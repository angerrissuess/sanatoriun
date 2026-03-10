import React, { useState } from 'react';

export default function PublicPortal() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Стандарт',
    procedures: [] as number[]
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('7') || val.startsWith('8')) {
      val = val.substring(1);
    }
    let formatted = '+7';
    if (val.length > 0) formatted += ` (${val.substring(0, 3)}`;
    if (val.length >= 4) formatted += `) ${val.substring(3, 6)}`;
    if (val.length >= 7) formatted += `-${val.substring(6, 8)}`;
    if (val.length >= 9) formatted += `-${val.substring(8, 10)}`;
    
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 18) {
      alert('Пожалуйста, введите корректный номер телефона');
      return;
    }
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Заявка успешно отправлена!');
        setFormData({ ...formData, fullName: '', phone: '', email: '', checkIn: '', checkOut: '' });
      }
    } catch (err) {
      alert('Ошибка при отправке заявки');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-sky-800 text-white py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-serif tracking-wide">Белые ночи</h1>
          <nav className="space-x-2 hidden md:block">
            <a href="#about" className="hover:bg-sky-700 hover:text-white px-5 py-2.5 rounded-full transition">О санатории</a>
            <a href="#procedures" className="hover:bg-sky-700 hover:text-white px-5 py-2.5 rounded-full transition">Процедуры</a>
            <a href="#rooms" className="hover:bg-sky-700 hover:text-white px-5 py-2.5 rounded-full transition">Номера</a>
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-map'))} className="hover:bg-sky-700 hover:text-white px-5 py-2.5 rounded-full transition">Карта отеля</button>
            <a href="#booking" className="hover:bg-sky-700 hover:text-white px-5 py-2.5 rounded-full transition">Бронирование</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] bg-stone-800 flex items-center justify-center text-center">
          <img src="/Img/img1.jpg" alt="Санаторий" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative z-10 max-w-3xl px-4">
            <h2 className="text-5xl font-serif text-white mb-4">Отдых и здоровье в гармонии с природой</h2>
            <p className="text-xl text-stone-200 mb-8">Восстановите силы в лучшем санатории региона</p>
            <a href="#booking" className="bg-sky-600 text-white px-8 py-3 rounded-full text-lg hover:bg-sky-500 transition shadow-lg inline-block">Забронировать путевку</a>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-20 max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-serif text-center mb-10 text-sky-900">О санатории</h3>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-stone-700 leading-relaxed mb-6">
                Санаторий «Белые ночи» — это уникальный оздоровительный комплекс, расположенный в экологически чистой зоне. Мы предлагаем современные методы лечения, комфортабельное проживание и индивидуальный подход к каждому гостю.
              </p>
              <ul className="space-y-3 text-stone-600">
                <li className="flex items-center"><span className="w-2 h-2 bg-sky-500 rounded-full mr-3"></span> Более 20 видов медицинских процедур</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-sky-500 rounded-full mr-3"></span> Собственный парк и выход к озеру</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-sky-500 rounded-full mr-3"></span> Трехразовое диетическое питание</li>
              </ul>
            </div>
            <img src="/Img/img11.jpg" alt="Природа" className="rounded-3xl shadow-xl" />
          </div>
        </section>

        {/* Procedures */}
        <section id="procedures" className="py-20 bg-stone-100">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-3xl font-serif text-center mb-10 text-sky-900">Медицинские процедуры</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Массаж спины', desc: 'Снятие напряжения и улучшение кровообращения', price: '1 500 ₽', img: '/Img/img2.jpg' },
                { name: 'Грязевые ванны', desc: 'Лечение суставов и кожных заболеваний', price: '2 000 ₽', img: '/Img/img3.jpg' },
                { name: 'Ароматерапия', desc: 'Восстановление нервной системы', price: '1 000 ₽', img: '/Img/img10.jpg' },
                { name: 'Физиотерапия', desc: 'Комплексное воздействие на организм', price: '1 800 ₽', img: '/Img/img5.jpg' }
              ].map((proc, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-stone-200">
                  <img src={proc.img} alt={proc.name} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <h4 className="text-xl font-medium text-stone-800 mb-2">{proc.name}</h4>
                    <p className="text-stone-600 text-sm mb-4">{proc.desc}</p>
                    <p className="text-sky-700 font-semibold">{proc.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rooms */}
        <section id="rooms" className="py-20 max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-serif text-center mb-10 text-sky-900">Номера</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { type: 'Стандарт', desc: 'Уютный номер для комфортного отдыха', price: 'от 3 000 ₽/сутки', img: '/Img/img6.jpg' },
              { type: 'Люкс', desc: 'Просторный номер с улучшенной планировкой', price: 'от 7 000 ₽/сутки', img: '/Img/img7.jpg' },
              { type: 'Апартаменты', desc: 'Двухкомнатный номер с собственной кухней', price: 'от 12 000 ₽/сутки', img: '/Img/img8.jpg' }
            ].map((room, i) => (
              <div key={i} className="bg-white rounded-3xl shadow-md overflow-hidden group">
                <div className="relative overflow-hidden">
                  <img src={room.img} alt={room.type} className="w-full h-64 object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-6 text-center">
                  <h4 className="text-2xl font-serif text-stone-800 mb-2">{room.type}</h4>
                  <p className="text-stone-600 mb-4">{room.desc}</p>
                  <p className="text-sky-700 font-semibold text-lg">{room.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Booking Form */}
        <section id="booking" className="py-20 bg-stone-200">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <h3 className="text-3xl font-serif text-center mb-8 text-sky-900">Оставить заявку</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">ФИО</label>
                    <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="Иванов Иван Иванович" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Телефон</label>
                    <input required type="tel" value={formData.phone} onChange={handlePhoneChange} className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" placeholder="+7 (___) ___-__-__" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Дата заезда</label>
                    <input required type="date" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Дата выезда</label>
                    <input required type="date" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Тип номера</label>
                  <select value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition">
                    <option value="Стандарт">Стандарт (от 3000 ₽/сутки)</option>
                    <option value="Люкс">Люкс (от 7000 ₽/сутки)</option>
                    <option value="Апартаменты">Апартаменты (от 12000 ₽/сутки)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Желаемые процедуры (зажмите Ctrl для множественного выбора)</label>
                  <select multiple value={formData.procedures.map(String)} onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => parseInt((option as HTMLOptionElement).value));
                    setFormData({...formData, procedures: options});
                  }} className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition h-32">
                    <option value="1">Массаж спины</option>
                    <option value="2">Грязевые ванны</option>
                    <option value="3">Ароматерапия</option>
                    <option value="4">Физиотерапия</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-sky-600 text-white font-medium py-4 rounded-full hover:bg-sky-500 transition shadow-lg text-lg">
                  Отправить заявку
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-8 text-center">
        <p>© 2026 Санаторий «Белые ночи». Все права защищены.</p>
        <p className="text-xs mt-2 opacity-50">Нажмите Ctrl+Shift+A для входа в панель администратора</p>
      </footer>
    </div>
  );
}