import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './database.ts';

// --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ---

try {
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM Room').get() as any;
  if (roomCount.count === 0) {
    const insertRoom = db.prepare('INSERT INTO Room (roomNumber, type, capacity, price) VALUES (?, ?, ?, ?)');
    
    // Строго по порядку создаем 15 красивых номеров
    for (let i = 1; i <= 5; i++) insertRoom.run(`Стандарт ${i}`, 'Стандарт', 2, 3000);
    for (let i = 1; i <= 5; i++) insertRoom.run(`Люкс ${i}`, 'Люкс', 2, 7000);
    for (let i = 1; i <= 5; i++) insertRoom.run(`Апартаменты ${i}`, 'Апартаменты', 2, 12000);
    
    console.log('✅ База номеров успешно заполнена по порядку');
  }
} catch (error) {
  console.error('Ошибка при инициализации номеров:', error);
}

try {
  const existingProcedures = db.prepare('SELECT * FROM Procedure').all();
  if (existingProcedures.length === 0) {
    const insertProc = db.prepare('INSERT INTO Procedure (id, name) VALUES (?, ?)');
    
    insertProc.run(1, 'Массаж спины');
    insertProc.run(2, 'Грязевые ванны');
    insertProc.run(3, 'Ароматерапия');
    insertProc.run(4, 'Физиотерапия');
    console.log('✅ Справочник процедур успешно заполнен');
  }
} catch (error) {
  console.error('Ошибка при инициализации процедур. Проверьте файл database.ts', error);
}

// --- ЗАПУСК СЕРВЕРА ---

async function startServer() {
  const app = express();
  // Динамический порт для работы на облачном хостинге Render
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- API МАРШРУТЫ ---

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM AdminUser WHERE username = ?').get(username) as any;
    
    if (user && user.passwordHash === password) {
      res.json({ success: true, token: 'fake-jwt-token' });
    } else {
      res.status(401).json({ success: false, message: 'Неверные учетные данные' });
    }
  });

  app.post('/api/bookings', (req, res) => {
    const { fullName, phone, email, checkIn, checkOut, roomType, procedures } = req.body;
    
    try {
      const insertGuest = db.prepare('INSERT INTO Guest (fullName, phone, email) VALUES (?, ?, ?)');
      const guestResult = insertGuest.run(fullName, phone, email || null);
      const guestId = guestResult.lastInsertRowid;

      // Умный поиск свободного номера с исключением занятых дат
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

      const roomId = room.id;
      const price = room.price;

      const insertBooking = db.prepare('INSERT INTO Booking (guestId, roomId, checkIn, checkOut, status, totalPrice) VALUES (?, ?, ?, ?, ?, ?)');
      const bookingResult = insertBooking.run(guestId, roomId, checkIn, checkOut, 'Pending', price * 3);
      const bookingId = bookingResult.lastInsertRowid;

      if (procedures && procedures.length > 0) {
        const insertProc = db.prepare('INSERT INTO BookingProcedure (bookingId, procedureId, scheduledAt) VALUES (?, ?, ?)');
        for (const procId of procedures) {
          insertProc.run(bookingId, procId, checkIn + ' 10:00');
        }
      }

      res.json({ success: true, bookingId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  });

  app.get('/api/public/map', (req, res) => {
    // ORDER BY id ASC гарантирует идеальный порядок
    const rooms = db.prepare('SELECT * FROM Room ORDER BY id ASC').all();
    const bookings = db.prepare(`
      SELECT b.*, g.fullName, g.phone, r.roomNumber 
      FROM Booking b 
      JOIN Guest g ON b.guestId = g.id 
      JOIN Room r ON b.roomId = r.id
    `).all();

    res.json({ rooms, bookings });
  });

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
      console.error('Ошибка при удалении гостя:', error);
      res.status(500).json({ success: false, message: 'Ошибка удаления' });
    }
  });

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

  app.get('/api/admin/data', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer fake-jwt-token') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const guests = db.prepare('SELECT * FROM Guest').all();
    // ORDER BY id ASC гарантирует идеальный порядок в админке
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
