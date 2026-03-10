import Database from 'better-sqlite3';

const db = new Database('sanatorium.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS AdminUser (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT
  );
  CREATE TABLE IF NOT EXISTS Guest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT,
      phone TEXT,
      email TEXT
  );
  CREATE TABLE IF NOT EXISTS Room (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomNumber TEXT,
      type TEXT,
      capacity INTEGER,
      price REAL
  );
  CREATE TABLE IF NOT EXISTS Booking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guestId INTEGER,
      roomId INTEGER,
      checkIn TEXT,
      checkOut TEXT,
      status TEXT,
      totalPrice REAL,
      FOREIGN KEY(guestId) REFERENCES Guest(id),
      FOREIGN KEY(roomId) REFERENCES Room(id)
  );
  CREATE TABLE IF NOT EXISTS Procedure (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      duration INTEGER,
      price REAL
  );
  CREATE TABLE IF NOT EXISTS BookingProcedure (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER,
      procedureId INTEGER,
      scheduledAt TEXT,
      FOREIGN KEY(bookingId) REFERENCES Booking(id),
      FOREIGN KEY(procedureId) REFERENCES Procedure(id)
  );
`);

// Insert mock data if empty
const adminCount = db.prepare('SELECT COUNT(*) as count FROM AdminUser').get() as any;
if (adminCount.count === 0) {
  db.prepare('INSERT INTO AdminUser (username, passwordHash) VALUES (?, ?)').run('admin', 'admin123');
  
  const insertRoom = db.prepare('INSERT INTO Room (roomNumber, type, capacity, price) VALUES (?, ?, ?, ?)');
  insertRoom.run('101', 'Стандарт', 2, 3000);
  insertRoom.run('102', 'Стандарт', 2, 3000);
  insertRoom.run('201', 'Люкс', 2, 7000);
  insertRoom.run('202', 'Люкс', 2, 7000);
  insertRoom.run('301', 'Апартаменты', 4, 12000);

  const insertProc = db.prepare('INSERT INTO Procedure (name, duration, price) VALUES (?, ?, ?)');
  insertProc.run('Массаж спины', 30, 1500);
  insertProc.run('Грязевые ванны', 45, 2000);
  insertProc.run('Ароматерапия', 20, 1000);
  insertProc.run('Физиотерапия', 40, 1800);
}

export default db;
