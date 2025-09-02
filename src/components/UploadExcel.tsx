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
    <div className="upload-excel">
      <div className="upload-controls">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <button 
          type="button" 
          className="select-button"
          onClick={() => inputRef.current?.click()}
        >
          Seleccionar archivo
        </button>
      </div>

      {status && (
        <div className="status-message">
          {status}
        </div>
      )}

      {/* Estilos CSS con responsive design */}
      <style>{`
        .upload-excel {
          display: grid;
          gap: 12px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }

        .upload-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .file-input {
          flex: 1;
          min-width: 200px;
          padding: 10px;
          border: 2px dashed #ddd;
          border-radius: 8px;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-input:hover {
          border-color: #00904c;
          background: #f0f8f0;
        }

        .file-input:focus {
          outline: none;
          border-color: #00904c;
          box-shadow: 0 0 0 3px rgba(0, 144, 76, 0.1);
        }

        .select-button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #00904c 0%, #007a3d 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .select-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 144, 76, 0.3);
        }

        .select-button:active {
          transform: translateY(0);
        }

        .status-message {
          padding: 12px;
          border-radius: 8px;
          background: #eef7ff;
          color: #0066cc;
          font-size: 0.9rem;
          border-left: 4px solid #0066cc;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE COMPLETO
        ======================================================================== */
        
        @media (max-width: 1200px) {
          .upload-excel {
            padding: 18px;
          }
          
          .upload-controls {
            gap: 10px;
          }
          
          .file-input {
            min-width: 180px;
            padding: 9px;
          }
          
          .select-button {
            padding: 9px 18px;
          }
        }
        
        @media (max-width: 768px) {
          .upload-excel {
            padding: 15px;
            border-radius: 12px;
          }
          
          .upload-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .file-input {
            min-width: auto;
            padding: 8px;
            border-radius: 6px;
          }
          
          .select-button {
            padding: 8px 16px;
            border-radius: 6px;
            text-align: center;
          }
          
          .status-message {
            padding: 10px;
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .upload-excel {
            padding: 12px;
            border-radius: 10px;
          }
          
          .upload-controls {
            gap: 6px;
          }
          
          .file-input {
            padding: 7px;
            border-radius: 5px;
            font-size: 14px;
          }
          
          .select-button {
            padding: 7px 14px;
            border-radius: 5px;
            font-size: 14px;
          }
          
          .status-message {
            padding: 8px;
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 360px) {
          .upload-excel {
            padding: 10px;
            border-radius: 8px;
          }
          
          .file-input {
            padding: 6px;
            border-radius: 4px;
            font-size: 13px;
          }
          
          .select-button {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
          }
          
          .status-message {
            padding: 6px;
            font-size: 0.75rem;
          }
        }
        
        /* Manejo especial para pantallas muy pequeñas */
        @media (max-width: 320px) {
          .upload-excel {
            padding: 8px;
          }
          
          .file-input {
            font-size: 12px;
          }
          
          .select-button {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
