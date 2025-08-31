import * as XLSX from 'xlsx';
import type { DataRow } from '../../type';

export class ExcelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelError';
  }
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const VALID_EXT = ['.xlsx', '.xls'];

function validateFile(file: File) {
  const name = file.name.toLowerCase();
  const okExt = VALID_EXT.some(ext => name.endsWith(ext));
  if (!okExt) throw new ExcelError('Formato no soportado. Sube .xlsx o .xls');
  if (file.size > MAX_SIZE_BYTES) {
    throw new ExcelError(`Archivo muy grande (${(file.size/1024/1024).toFixed(1)}MB). Máx 5MB`);
  }
}

export async function readExcel(file: File, sheetIndex = 0): Promise<DataRow[]> {
  validateFile(file);
  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array', cellDates: true });
    const sheetName = wb.SheetNames[sheetIndex];
    if (!sheetName) throw new ExcelError('La hoja indicada no existe');

    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<DataRow>(ws, {
      raw: false,
      defval: null
    });

    // Normaliza posibles números en string
    return json.map((r) => {
      const out: DataRow = {};
      for (const k of Object.keys(r)) {
        const v = r[k];
        if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) {
          out[k] = Number(v);
        } else {
          out[k] = v;
        }
      }
      return out;
    });
  } catch (e) {
    if (e instanceof ExcelError) throw e;
    throw new ExcelError('No se pudo leer el Excel. Verifica el archivo.');
  }
}
