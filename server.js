const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ── CORS ──
const allowedOrigins = [
  'https://jasadesign-admin.netlify.app',
  'https://jasadesign0.netlify.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Akses diblokir oleh CORS'));
  }
}));
app.use(express.json({ limit: '20mb' }));

// ── MONGODB CONNECTION ──
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas terhubung!'))
  .catch(err => console.error('❌ MongoDB gagal connect:', err));

// ────────────────────────────────────────────
// ── SCHEMAS & MODELS ──
// ────────────────────────────────────────────

// Texts: simpan sebagai satu dokumen { key: value }
const textsSchema = new mongoose.Schema({
  _id: { type: String, default: 'site_texts' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const Texts = mongoose.model('Texts', textsSchema);

// Images: simpan sebagai satu dokumen { key: base64 }
const imagesSchema = new mongoose.Schema({
  _id: { type: String, default: 'site_images' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const Images = mongoose.model('Images', imagesSchema);

// Comments: satu dokumen per komentar
const commentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  role: String,
  text: String,
  rating: { type: Number, default: 5 },
  date: String,
  createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', commentSchema);

// ── ROOT ──
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Backend KREASI.STUDIO + MongoDB Atlas!' });
});

// ── STATUS ──
app.get('/api/status', async (req, res) => {
  try {
    const textsDoc = await Texts.findById('site_texts');
    const imagesDoc = await Images.findById('site_images');
    const commentsCount = await Comment.countDocuments();
    res.json({
      status: 'success',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      texts_count: Object.keys(textsDoc?.data || {}).length,
      images_count: Object.keys(imagesDoc?.data || {}).length,
      comments_count: commentsCount
    });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ────────────────────────────────────────────
// ── TEXTS API ──
// ────────────────────────────────────────────

app.get('/api/texts', async (req, res) => {
  try {
    const doc = await Texts.findById('site_texts');
    res.json({ status: 'success', data: doc?.data || {} });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.post('/api/texts', async (req, res) => {
  try {
    const { texts } = req.body;
    if (!texts || typeof texts !== 'object')
      return res.status(400).json({ status: 'error', message: 'Data texts tidak valid' });

    const doc = await Texts.findById('site_texts');
    const merged = { ...(doc?.data || {}), ...texts };

    await Texts.findByIdAndUpdate(
      'site_texts',
      { $set: { data: merged } },
      { upsert: true, new: true }
    );
    res.json({ status: 'success', message: 'Teks berhasil disimpan ke MongoDB', data: merged });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.delete('/api/texts', async (req, res) => {
  try {
    await Texts.findByIdAndUpdate('site_texts', { $set: { data: {} } }, { upsert: true });
    res.json({ status: 'success', message: 'Semua teks direset' });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ────────────────────────────────────────────
// ── IMAGES API ──
// ────────────────────────────────────────────

app.get('/api/images', async (req, res) => {
  try {
    const doc = await Images.findById('site_images');
    res.json({ status: 'success', data: doc?.data || {} });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.post('/api/images', async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || typeof images !== 'object')
      return res.status(400).json({ status: 'error', message: 'Data images tidak valid' });

    const doc = await Images.findById('site_images');
    const merged = { ...(doc?.data || {}), ...images };

    await Images.findByIdAndUpdate(
      'site_images',
      { $set: { data: merged } },
      { upsert: true, new: true }
    );
    res.json({ status: 'success', message: 'Gambar berhasil disimpan ke MongoDB', count: Object.keys(merged).length });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.delete('/api/images', async (req, res) => {
  try {
    await Images.findByIdAndUpdate('site_images', { $set: { data: {} } }, { upsert: true });
    res.json({ status: 'success', message: 'Semua gambar direset' });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ────────────────────────────────────────────
// ── COMMENTS API ──
// ────────────────────────────────────────────

app.get('/api/comments', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    res.json({ status: 'success', data: comments });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { id, name, role, text, rating, date } = req.body;
    if (!name || !text)
      return res.status(400).json({ status: 'error', message: 'Nama dan teks wajib diisi' });

    const newComment = new Comment({
      id: id || Date.now().toString(),
      name, role: role || '', text,
      rating: rating || 5,
      date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    });
    await newComment.save();
    res.json({ status: 'success', message: 'Komentar berhasil ditambahkan', data: newComment });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const result = await Comment.findOneAndDelete({ id: req.params.id });
    if (!result)
      return res.status(404).json({ status: 'error', message: 'Komentar tidak ditemukan' });
    res.json({ status: 'success', message: 'Komentar berhasil dihapus' });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── RESET ALL ──
app.delete('/api/reset', async (req, res) => {
  try {
    await Texts.findByIdAndUpdate('site_texts', { $set: { data: {} } }, { upsert: true });
    await Images.findByIdAndUpdate('site_images', { $set: { data: {} } }, { upsert: true });
    await Comment.deleteMany({});
    res.json({ status: 'success', message: 'Semua data direset dari MongoDB' });
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── PORT ──
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server KREASI.STUDIO jalan di port ${PORT}`);
});
