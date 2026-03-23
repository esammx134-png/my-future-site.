const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const basicAuth = require('express-basic-auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'visitor-count.json');
const VISITS_FILE = path.join(__dirname, 'visits.json');

function readCount() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw).count || 0;
  } catch (error) {
    return 0;
  }
}

function writeCount(count) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ count: Number(count) }, null, 2));
}

function readVisits() {
  try {
    const raw = fs.readFileSync(VISITS_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch (error) {
    return [];
  }
}

function writeVisits(visits) {
  fs.writeFileSync(VISITS_FILE, JSON.stringify(visits, null, 2));
}

app.get('/api/visitors', (req, res) => {
  const count = readCount() + 1;
  writeCount(count);
  res.json({ count });
});

app.get('/api/visitors/raw', (req, res) => {
  res.json({ count: readCount() });
});

app.post('/api/track-visit', (req, res) => {
  const { page } = req.body;
  const visits = readVisits();
  visits.push({
    page: page || 'unknown',
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress
  });
  writeVisits(visits);
  res.json({ success: true });
});

// Basic auth for admin
const adminAuth = basicAuth({
  users: { 'esam': 'rasha2011' }, // يمكن تغيير كلمة المرور هنا
  challenge: true,
  realm: 'Admin Area'
});

app.get('/admin', adminAuth, (req, res) => {
  const count = readCount();
  const visits = readVisits();
  const pageStats = visits.reduce((acc, visit) => {
    acc[visit.page] = (acc[visit.page] || 0) + 1;
    return acc;
  }, {});

  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>صفحة التحكم - THE FUTURE</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #C9A84C; }
        .stat { margin: 20px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #C9A84C; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #C9A84C; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>صفحة التحكم</h1>
        <div class="stat">
          <h2>عدد الزوار الكلي: ${count}</h2>
        </div>
        <div class="stat">
          <h2>إحصائيات الصفحات:</h2>
          <ul>
            ${Object.entries(pageStats).map(([page, count]) => `<li>${page}: ${count} زيارة</li>`).join('')}
          </ul>
        </div>
        <h2>تفاصيل الزيارات:</h2>
        <table>
          <tr><th>الصفحة</th><th>التاريخ والوقت</th><th>IP</th></tr>
          ${visits.slice(-50).reverse().map(visit => `<tr><td>${visit.page}</td><td>${new Date(visit.timestamp).toLocaleString('ar')}</td><td>${visit.ip}</td></tr>`).join('')}
        </table>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Visitor count server running on http://localhost:${PORT}`);
});