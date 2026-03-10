import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './database.ts';

async function startServer() {
  const app = express();
  // Динамический порт для Render
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- API МАРШРУТЫ ---

  // Авторизация админа
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM AdminUser WHERE username = ?').get(username) as any;
    
    if (user && user.passwordHash === password) {
      res.json({ success: true, token: 'fake-jwt-token' });
    } else {
      res.status(401).json({ success: false, message: 'Неверные учетные данные' });
    }
  });

  // Создание нового бронирования гостем
  app.post('/api/bookings', (req, res) => {
    const { fullName, phone, email, checkIn, checkOut, roomType, procedures } = req.body;
    
    try {
      // 1. Создаем гостя
      const insertGuest = db.prepare('INSERT INTO Guest (fullName, phone, email) VALUES (?, ?, ?)');
      const guestResult = insertGuest.run(fullName, phone, email || null);
      const guestId = guestResult.lastInsertRowid;

      // 2. Ищем свободный номер строго по порядку (ORDER BY id ASC)
      const room = db.prepare(`
        SELECT id, price FROM Room 
        WHERE type = ? AND id NOT IN (
          SELECT roomId FROM Booking 
          WHERE status != 'Cancelled' AND (checkIn < ? AND checkOut > ?)
        ) ORDER BY id ASC LIMIT 1
      `).get(roomType, checkOut, checkIn) as any;

      if (!room) {
        return res.status(400).json({ 
          success: false, 
          message: `К сожалению, все номера категории «${roomType}» на эти даты заняты. Пожалуйста, выберите другие даты или тип номера.` 
        });
      }

      // 3. Создаем путевку
      const roomId = room.id;
      const price = room.price;
      const insertBooking = db.prepare('INSERT INTO Booking (guestId, roomId, checkIn, checkOut, status, totalPrice) VALUES (?, ?, ?, ?, ?, ?)');
      const bookingResult = insertBooking.run(guestId, roomId, checkIn, checkOut, 'Pending', price * 3);
      const bookingId = bookingResult.lastInsertRowid;

      // 4. Добавляем процедуры, если они выбраны
      if (procedures && procedures.length > 0) {
        const insertProc = db.prepare('INSERT INTO BookingProcedure (bookingId, procedureId, scheduledAt) VALUES (?, ?, ?)');
        for (const procId of procedures) {
          insertProc.run(bookingId, procId, checkIn + ' 10:00');
        }
      }

      res.json({ success: true, bookingId });
    } catch (error) {
      console.error('Ошибка при создании брони:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  });

  // Данные для публичной карты отеля
  app.get('/api/public/map', (req, res) => {
    const rooms = db.prepare('SELECT * FROM Room ORDER BY id ASC').all();
    const bookings = db.prepare(`
      SELECT b.*, g.fullName, g.phone, r.roomNumber 
      FROM Booking b 
      JOIN Guest g ON b.guestId = g.id 
      JOIN Room r ON b.roomId = r.id
    `).all();

    res.json({ rooms, bookings });
  });

  // Удаление гостя (Админка)
  app.delete('/api/admin/guests/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer fake-jwt-token') return res.status(401).json({ message: 'Unauthorized' });

    try {
      const guestId = Number(req.params.id);
      db.prepare('DELETE FROM BookingProcedure WHERE bookingId IN (SELECT id FROM Booking WHERE guestId = ?)').run(guestId);
      db.prepare('DELETE FROM Booking WHERE guestId = ?').run(guestId);
      db.prepare('DELETE FROM Guest WHERE id = ?').run(guestId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Ошибка удаления' });
    }
  });

  // Обновление гостя (Админка)
  app.put('/api/admin/guests/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer fake-jwt-token') return res.status(401).json({ message: 'Unauthorized' });

    const { fullName, phone, email } = req.body;
    try {
      db.prepare('UPDATE Guest SET fullName = ?, phone = ?, email = ? WHERE id = ?')
        .run(fullName, phone, email, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Ошибка обновления' });
    }
  });

  // Сбор всех данных для Дашборда (Админка)
  app.get('/api/admin/data', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer fake-jwt-token') return res.status(401).json({ message: 'Unauthorized' });

    const guests = db.prepare('SELECT * FROM Guest').all();
    const rooms = db.prepare('SELECT * FROM Room ORDER BY id ASC').all();

    const bookings = db.prepare(`
      SELECT b.*, g.fullName, g.phone, r.roomNumber 
      FROM Booking b 
      JOIN Guest g ON b.guestId = g.id 
      JOIN Room r ON b.roomId = r.id
    `).all();
    
    const procedures = db.prepare('SELECT * FROM Procedure').all();
    const procedureSchedules = db.prepare(`
      SELECT bp.*, p.name as procedureName, g.fullName as guestName, r.roomNumber
      FROM BookingProcedure bp
      JOIN Procedure p ON bp.procedureId = p.id
      JOIN Booking b ON bp.bookingId = b.id
      JOIN Guest g ON b.guestId = g.id
      JOIN Room r ON b.roomId = r.id
    `).all();

    const today = new Date().toISOString().split('T')[0];
    const activeBookings = bookings.filter((b: any) => b.checkIn <= today && b.checkOut >= today);
    const occupancy = rooms.length > 0 ? Math.round((activeBookings.length / rooms.length) * 100) : 0;

    res.json({
      guests, 
      rooms, 
      bookings, 
      procedures, 
      procedureSchedules,
      stats: {
        occupancy,
        todayArrivals: bookings.filter((b: any) => b.checkIn === today).length,
        pendingApplications: bookings.filter((b: any) => b.status === 'Pending').length
      }
    });
  });

  // --- VITE & STATIC ФАЙЛЫ ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => { 
    console.log(`Server running on port ${PORT}`); 
  });
}

startServer();
