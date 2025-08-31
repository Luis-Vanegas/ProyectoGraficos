import { useRef, useState } from 'react';
import { readExcel, ExcelError } from '../utils/utils/excel';
import type { DataRow } from '../type';

interface Props {
  onData: (rows: DataRow[]) => void;
}

export default function UploadExcel({ onData }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>('');

  const handleFile = async (f: File) => {
    try {
      setStatus('Leyendo archivo...');
      const rows = await readExcel(f, 0); // devuelve DataRow[]
      onData(rows);
      setStatus(`${rows.length} filas cargadas`);
    } catch (e: unknown) {
      const msg = e instanceof ExcelError ? e.message : 'Error inesperado';
      setStatus(msg);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <button type="button" onClick={() => inputRef.current?.click()}>
          Seleccionar archivo
        </button>
      </div>

      {status && (
        <div style={{ padding: 8, borderRadius: 8, background: '#eef7ff' }}>
          {status}
        </div>
      )}
    </div>
  );
}
