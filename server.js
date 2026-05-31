const express = require('express');
const cors = require('cors');
const app = express();

// Whitelist URL frontend Netlify untuk Production
const allowedOrigins = [
  'https://jasadesign-admin.netlify.app',
  'https://jasadesign0.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Akses diblokir oleh CORS'));
    }
  }
}));

app.use(express.json());

// Endpoint Root (Biar pas buka URL Railway nggak "Cannot GET /")
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Backend up and running di Root!' });
});

// Endpoint API Status (Sesuai kode lu)
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Backend berjalan dan siap melayani kedua frontend Netlify!' 
  });
});

// Konfigurasi Port Dinamis untuk Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});
