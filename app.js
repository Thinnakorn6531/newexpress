// Import required modules
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const axios = require('axios');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Middleware to parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MySQL database connection configuration
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'room_reservation_system'
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

//======================route====================//
// Route เพื่อส่งหน้าเว็บ register.html
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route เพื่อส่งหน้าเว็บ login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route เพื่อส่งหน้าเว็บ student_booking.html
app.get('/student_booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student_booking.html'));
});

// Route เพื่อส่งหน้าเว็บ lecture_dashboard.html
app.get('/lecture_dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lecture_dashboard.html'));
});

// Route เพื่อส่งหน้าเว็บ staff_dashboard.html
app.get('/staff_dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff_dashboard.html'));
});

// Route เพื่อส่งหน้าเว็บ staff_dashboard.html
app.get('/student_booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student_booking.html'));
});

// Route สำหรับบันทึกข้อมูลการจองห้อง
// app.post('/bookRoom', (req, res) => {
//   const { student_status, date, time_slot, status } = req.body;
//   // สร้างคำสั่ง SQL INSERT เพื่อบันทึกข้อมูล
//   const sql = `INSERT INTO student_booking (student_status, date, time_slot, status) VALUES (?, ?, ?, ?)`;

//   // Execute SQL query
//   connection.query(sql, [student_status, date, time_slot, status], (err, result) => {
//     if (err) {
//       console.error('Error inserting data: ' + err.stack);
//       res.status(500).json({ message: 'Failed to book room' });
//     } else {
//       console.log('Booking successful');
//       res.status(200).json({ message: 'Room booked successfully' });
//     }
//   });
// });
// โมเดลข้อมูลการจองห้อง
const Booking = 'CREATE TABLE IF NOT EXISTS student_bookings (' +
  'id INT AUTO_INCREMENT PRIMARY KEY,' +
  'student_status VARCHAR(255),' +
  'date VARCHAR(255),' +
  'time_slot VARCHAR(255),' +
  'status VARCHAR(255))';


//================API=====================//
app.post('/register', (req, res) => {
  const { role, name, username, password } = req.body;

  // ตรวจสอบว่า role ถูกต้องหรือไม่
  if (!['student', 'staff', 'lecture'].includes(role)) {
    return res.status(400).send('Invalid role');
  }

  let tableName;
  switch (role) {
    case 'student':
      tableName = 'student';
      break;
    case 'staff':
      tableName = 'staff';
      break;
    case 'lecture':
      tableName = 'lecture';
      break;
    default:
      return res.status(400).send('Invalid role');
  }

  // Check if username already exists
  const checkUsernameQuery = `SELECT * FROM ${tableName} WHERE username = ?`;
  connection.query(checkUsernameQuery, [username], (err, result) => {
    if (err) {
      console.error('Error checking username:', err);
      return res.status(500).send(`Error registering ${role}`);
    }
    if (result.length > 0) {
      return res.status(200).send('Username already exists');
    }

    // Insert new user data into database
    const registerQuery = `INSERT INTO ${tableName} (name, username, password) VALUES (?, ?, ?)`;
    connection.query(registerQuery, [name, username, password], (err, result) => {
      if (err) {
        console.error(`Error registering ${role}:`, err);
        return res.status(500).send(`Error registering ${role}`);
      }
      console.log(`${role} registered successfully`);
      res.redirect('/login'); // ทำการ redirect ไปยังหน้า login.html
      res.end(); // หยุดการประมวลผลและส่งการตอบกลับ
    });
  });
});

//=================================================//
// รับข้อมูลจากฟอร์มเข้าสู่ระบบ
app.post('/login', (req, res) => {
  const { role, username, password } = req.body;

  let redirectUrl;
  let tableName;

  switch (role) {
    case 'student':
      redirectUrl = '/student_booking.html'; // เปลี่ยนเป็น URL ของหน้า student_booking.html
      tableName = 'student'; // ตารางของนักเรียน
      break;
    case 'staff':
      redirectUrl = '/staff_dashboard.html';
      tableName = 'staff';
      break;
    case 'lecture':
      redirectUrl = '/lecture_dashboard.html';
      tableName = 'lecture';
      break;
    default:
      return res.status(400).send('Invalid role');
  }

  // Check if username and password match
  const loginQuery = `SELECT * FROM ${tableName} WHERE username = ? AND password = ?`;
  connection.query(loginQuery, [username, password], (err, result) => {
    if (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
    if (result.length === 0) {
      console.log('Invalid username or password');
      return res.status(401).send('Invalid username or password');
    }
    console.log(`${role} login successful`);
    res.redirect(redirectUrl); // Redirect to appropriate dashboard or booking page
  });
});




//==============================//
// Handle staff login
app.post('/api/staff/login', (req, res) => {
  const { username, password } = req.body;

  const loginQuery = 'SELECT * FROM staff WHERE username = ? AND password = ?';
  connection.query(loginQuery, [username, password], (err, result) => {
    if (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
    if (result.length === 0) {
      console.log('Invalid username or password');
      return res.status(401).send('Invalid username or password');
    }
    console.log('Staff login successful');
    res.send('Staff login successful!');
  });
});

// รับข้อมูลจากฟอร์มลงทะเบียน staff
app.post('/register/staff', (req, res) => {
  const { name, username, password } = req.body;

  // Check if username already exists
  const checkUsernameQuery = 'SELECT * FROM staff WHERE username = ?';
  connection.query(checkUsernameQuery, [username], (err, result) => {
    if (err) {
      console.error('Error checking username:', err);
      return res.status(500).send('Error registering staff');
    }
    if (result.length > 0) {
      return res.status(400).send('Username already exists');
    }

    // Insert new staff data into database
    const registerQuery = 'INSERT INTO staff (name, username, password) VALUES (?, ?, ?)';
    connection.query(registerQuery, [name, username, password], (err, result) => {
      if (err) {
        console.error('Error registering staff:', err);
        return res.status(500).send('Error registering staff');
      }
      console.log('Staff registered successfully');
      res.redirect('/login'); // ทำการ redirect ไปยังหน้า login.html
      res.send('Registration successful!');
    });
  });
});

// รับข้อมูลจากฟอร์มเข้าสู่ระบบบุคลากร
app.post('/login/staff', (req, res) => {
  const { username, password } = req.body;

  // Check if username and password match
  const loginQuery = 'SELECT * FROM staff WHERE username = ? AND password = ?';
  connection.query(loginQuery, [username, password], (err, result) => {
    if (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
    if (result.length === 0) {
      console.log('Invalid username or password');
      return res.status(401).send('Invalid username or password');
    }
    console.log('Staff login successful');
    res.send('Staff login successful!');
  });
});


// การตรวจสอบเข้าสู่ระบบของบุคคลากร (staff) และวิทยากร (lecture):
app.post('/api/lecture/login', (req, res) => {
  const { username, password } = req.body;

  const loginQuery = 'SELECT * FROM lecture WHERE username = ? AND password = ?';
  connection.query(loginQuery, [username, password], (err, result) => {
    if (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
    if (result.length === 0) {
      console.log('Invalid username or password');
      return res.status(401).send('Invalid username or password');
    }
    console.log('Lecture login successful');
    res.send('Lecture login successful!');
  });
});

//การบันทึกการจองห้องโดยนักศึกษา:
app.post('/bookRoom', (req, res) => {
  const { student_status, date, time_slot, status } = req.body;
  // สร้างคำสั่ง SQL INSERT เพื่อบันทึกข้อมูล
  const sql = `INSERT INTO student_bookings (student_status, date, time_slot, status) VALUES (?, ?, ?, ?)`;

  // Execute SQL query
  connection.query(sql, [student_status, date, time_slot, status], (err, result) => {
    if (err) {
      console.error('Error inserting data: ' + err.stack);
      res.status(500).json({ message: 'Failed to book room' });
    } else {
      console.log('Booking successful');
      res.status(200).json({ message: 'Room booked successfully' });
    }
  });
});



// app.all('/api/student/book-room', (req, res) => {
//   res.status(405).send('Method Not Allowed');
// });



//การเช็คสถานะการขอจอง:
app.get('/api/student/request-status', (req, res) => {
});

app.get('/api/lecture/booking-requests', (req, res) => {
});


//การอนุมัติหรือปฏิเสธการจองโดยlecture:
app.put('/api/lecture/approve-booking/:bookingId', (req, res) => {
});

// Handle disapproving booking request
app.put('/api/lecture/disapprove-booking/:bookingId', (req, res) => {
});

//การเพิ่มห้อง, แก้ไขห้อง, และปิดการใช้งานห้องโดยเจ้าหน้าที่ (staff):
app.post('/api/staff/add-room', (req, res) => {
});

// Handle editing room
app.put('/api/staff/edit-room/:roomId', (req, res) => {
});

// Handle disabling room
app.put('/api/staff/disable-room/:roomId', (req, res) => {
});


//การดู Dashboard:
// Handle getting staff dashboard data
app.get('/api/staff/dashboard', (req, res) => {
  // Implement staff dashboard data fetching logic here
});

// Handle getting lecture dashboard data
app.get('/api/lecture/dashboard', (req, res) => {
  // Implement lecture dashboard data fetching logic here
});


//การดูประวัติการจอง:
// Handle getting student booking history
app.get('/api/student/history', (req, res) => {
  // Implement student booking history fetching logic here
});

// Handle getting staff booking history for all lectures
app.get('/api/staff/history', (req, res) => {
  // Implement staff booking history fetching logic here
});

// Handle getting lecture booking history
app.get('/api/lecture/history', (req, res) => {
  // Implement lecture booking history fetching logic here
});


//การออกจากระบบ:
// Handle student logout
app.get('/api/student/logout', (req, res) => {
  // Implement student logout logic here
});

// Handle staff logout
app.get('/api/staff/logout', (req, res) => {
  // Implement staff logout logic here
});

// Handle lecture logout
app.get('/api/lecture/logout', (req, res) => {
  // Implement lecture logout logic here
});


const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

module.exports = app;
