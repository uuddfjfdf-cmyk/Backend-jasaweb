const express = require('express');
const cors = require('cors');
const app = express();

// Masukkan URL kedua frontend lu di sini
const allowedOrigins = [
  'http://localhost:3000', // Frontend 1 (misal: React/Next.js)
  'http://localhost:5173'  // Frontend 2 (misal: Vue/Vite)
];

// Konfigurasi CORS untuk 2 frontend
app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (seperti dari Postman) atau yang ada di allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Akses diblokir oleh CORS'));
    }
  }
}));

// Middleware untuk memparsing JSON body
app.use(express.json());

// Contoh Endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Backend berjalan dan siap melayani kedua frontend!' 
  });
});

// Jalankan server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
});
