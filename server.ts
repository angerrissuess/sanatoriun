import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './database.ts';

// Initialize rooms
const types = ['Стандарт', 'Люкс', 'Апартаменты'];
let allRooms = db.prepare('SELECT * FROM Room').all();
for (let type of types) {
  const typeRooms = allRooms.filter((r: any) => r.type === type);
  for (let i = 1; i <= 5; i++) {
    const roomNumber = `Отель ${type} ${i}`;
    const capacity = type === 'Стандарт' ? 2 : type === 'Люкс' ? 3 : 4;
    const price = type === 'Стандарт' ? 3000 : type === 'Люкс' ? 7000 : 12000;
    
    if (i <= typeRooms.length) {
      db.prepare('UPDATE Room SET roomNumber = ?, capacity = ?, price = ? WHERE id = ?')
        .run(roomNumber, capacity, price, typeRooms[i-1].id);
    } else {
      db.prepare('INSERT INTO Room (roomNumber, type, capacity, price) VALUES (?, ?, ?, ?)')
        .run(roomNumber, type, capacity, price);
    }
  }
}
try {
  const existingProcedures = db.prepare('SELECT * FROM Procedure').all();
  if (existingProcedures.length === 0) {
    const insertProc = db.prepare('INSERT INTO Procedure (id, name) VALUES (?, ?)');
    
    insertProc.run(1, 'Массаж спины');
    insertProc.run(2, 'Грязевые ванны');
    insertProc.run(3, 'Ароматерапия');
    insertProc.run(4, 'Физиотерапия');
    console.log('Справочник процедур успешно заполнен');
  }
} catch (error) {
  console.error('Ошибка при инициализации процедур. Проверьте файл database.ts', error);
}
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
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

      // Find a room of roomType
      const room = db.prepare('SELECT id, price FROM Room WHERE type = ? LIMIT 1').get(roomType) as any;
      const roomId = room ? room.id : 1; // fallback
      const price = room ? room.price : 5000;

      const insertBooking = db.prepare('INSERT INTO Booking (guestId, roomId, checkIn, checkOut, status, totalPrice) VALUES (?, ?, ?, ?, ?, ?)');
      const bookingResult = insertBooking.run(guestId, roomId, checkIn, checkOut, 'Pending', price * 3); // simplified price calc
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
    const rooms = db.prepare('SELECT * FROM Room').all();
    const bookings = db.prepare(`
      SELECT b.*, g.fullName, g.phone, r.roomNumber 
      FROM Booking b 
      JOIN Guest g ON b.guestId = g.id 
      JOIN Room r ON b.roomId = r.id
    `).all();

    res.json({
      rooms,
      bookings
    });
  });
app.delete('/api/admin/guests/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer fake-jwt-token') return res.status(401).json({ message: 'Unauthorized' });

    try {
      const guestId = Number(req.params.id); // Убеждаемся, что ID это число

      // 1. Сначала удаляем записи о процедурах, привязанные к брони этого гостя
      db.prepare('DELETE FROM BookingProcedure WHERE bookingId IN (SELECT id FROM Booking WHERE guestId = ?)').run(guestId);
      
      // 2. Затем удаляем сами бронирования этого гостя
      db.prepare('DELETE FROM Booking WHERE guestId = ?').run(guestId);
      
      // 3. И только теперь безопасно удаляем карточку гостя
      db.prepare('DELETE FROM Guest WHERE id = ?').run(guestId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении гостя:', error);
      res.status(500).json({ success: false, message: 'Ошибка удаления' });
    }
  });

  // Обновление клиента
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
    const rooms = db.prepare('SELECT * FROM Room').all();

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

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
