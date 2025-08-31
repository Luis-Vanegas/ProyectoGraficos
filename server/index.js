const express = require('express');
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
app.use(cors());

// Ruta del Excel en el servidor
const FILE_PATH = path.resolve(__dirname, 'data', 'datos.xlsx');

// Utilidad para leer una hoja a JSON tipado suave
function readSheet(sheetName) {
  const wb = XLSX.readFile(FILE_PATH, { cellDates: true });
  const sheet = sheetName || wb.SheetNames[0];
  if (!wb.SheetNames.includes(sheet)) {
    return { error: `La hoja "${sheet}" no existe`, rows: [] };
  }
  const ws = wb.Sheets[sheet];
  const rows = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null })
    .map(r => {
      // normaliza números que vengan como string
      const out = {};
      for (const k of Object.keys(r)) {
        const v = r[k];
        out[k] = (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)))
          ? Number(v)
          : v;
      }
      return out;
    });

  return { error: null, rows };
}

// Lista de hojas
app.get('/api/sheets', (req, res) => {
  const wb = XLSX.readFile(FILE_PATH, { cellDates: true });
  res.json({ sheets: wb.SheetNames });
});

// Datos de una hoja (por defecto, la primera)
app.get('/api/data', (req, res) => {
  const sheet = req.query.sheet;
  const { error, rows } = readSheet(sheet);
  if (error) return res.status(400).json({ error });
  res.json({ rows });
});

// (Opcional) cache-control mínimo
app.set('etag', false);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
