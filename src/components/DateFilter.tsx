import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';

// Configurar dayjs en español
dayjs.locale('es');

interface DateFilterProps {
  onDateChange: (date: Dayjs | null) => void;
  label?: string;
  placeholder?: string;
  value?: Dayjs | null;
  disabled?: boolean;
}

const DateFilter: React.FC<DateFilterProps> = ({
  onDateChange,
  label = "Filtrar por fecha",
  placeholder = "Seleccionar fecha",
  value = null,
  disabled = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(value);

  // Sincronizar el estado interno con el prop value cuando cambie
  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const handleDateChange = (newValue: Dayjs | null) => {
    setSelectedDate(newValue);
    onDateChange(newValue);
  };

  return (
    <div style={{ 
      minWidth: '200px',
      maxWidth: '300px',
      width: '100%'
    }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <DemoContainer components={['DatePicker']}>
          <DatePicker
            label={label}
            value={selectedDate}
            onChange={handleDateChange}
            disabled={disabled}
            slotProps={{
              textField: {
                placeholder: placeholder,
                size: 'small',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3B82F6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3B82F6',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#6B7280',
                    '&.Mui-focused': {
                      color: '#3B82F6',
                    },
                  },
                }
              }
            }}
            format="DD/MM/YYYY"
            views={['year', 'month', 'day']}
            openTo="month"
          />
        </DemoContainer>
      </LocalizationProvider>
    </div>
  );
};

export default DateFilter;
