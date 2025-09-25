import React, { useCallback, useMemo } from 'react';
import Select from 'react-select';
import type { MultiValue, StylesConfig, ControlProps, OptionProps } from 'react-select';

interface ImprovedMultiSelectProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ImprovedMultiSelect: React.FC<ImprovedMultiSelectProps> = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  disabled = false,
  placeholder = "Seleccionar opciones..."
}) => {
  // Memoizar las opciones para evitar re-renders innecesarios
  const selectOptions = useMemo(() => 
    options.map(option => ({
      value: option,
      label: option
    })), [options]
  );

  // Memoizar los valores seleccionados para evitar re-renders innecesarios
  const selectedOptions = useMemo(() => 
    selectedValues.map(value => ({
      value,
      label: value
    })), [selectedValues]
  );

  // Callback memoizado para el cambio de selección
  const handleChange = useCallback((newValue: MultiValue<{value: string; label: string}>) => {
    
    // Convertir de vuelta a array de strings
    const newValues = newValue ? newValue.map((option: {value: string; label: string}) => option.value) : [];
    
    onSelectionChange(newValues);
  }, [onSelectionChange]);

  // Estilos personalizados para mejor UX
  const customStyles: StylesConfig<{value: string; label: string}, true> = {
    control: (provided, state: ControlProps<{value: string; label: string}, true>) => ({
      ...provided,
      minHeight: '48px',
      border: state.isFocused ? '2px solid #3b82f6' : '2px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        border: '2px solid #3b82f6'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e0f2fe',
      borderRadius: '4px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#0369a1',
      fontWeight: '500'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#0369a1',
      '&:hover': {
        backgroundColor: '#bae6fd',
        color: '#0c4a6e'
      }
    }),
    option: (provided, state: OptionProps<{value: string; label: string}, true>) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#f3f4f6' 
        : 'white',
      color: state.isSelected ? 'white' : '#000000',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6b7280'
    })
  };

  return (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <Select
        isMulti
        options={selectOptions}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isClearable={false}
        isSearchable={true}
        styles={customStyles}
        className="improved-multi-select"
        classNamePrefix="improved-multi-select"
        noOptionsMessage={() => "No hay opciones disponibles"}
        loadingMessage={() => "Cargando..."}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        backspaceRemovesValue={true}
        isOptionDisabled={() => false}
        maxMenuHeight={300}
        menuPlacement="auto"
      />
    </div>
  );
};

export default ImprovedMultiSelect;
