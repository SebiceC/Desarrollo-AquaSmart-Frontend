import React, { useState } from "react";
import { Search } from "lucide-react";
import { validateField } from "./ValidationRules";

const InputFilter = ({ personTypes, filters, onFilterChange, onApplyFilters }) => {
  const [errors, setErrors] = useState({});

  // Manejar cambios en el input de documento (ID)
  const handleIdChange = (e) => {
    const { value } = e.target;
    onFilterChange("id", value); // Mantenemos 'id' como key en los filtros
    
    
  };

  // Manejar cambios en el select de tipo de persona (corregido)
  const handlePersonTypeChange = (e) => {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    onFilterChange("personType", value);
  };

  // Manejar cambios en los filtros de fecha
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div className="p-4 rounded-lg flex items-center justify-between">
      {/* Filtro por Documento */}
      <div className="relative w-1/4">
        <span className="absolute left-3 top-2 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          name="document"
          placeholder="Filtrar por documento"
          className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none"
          value={filters.id} // Usamos filters.id que corresponde al documento
          onChange={handleIdChange}
          maxLength={15}
        />
        {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document}</p>}
      </div>

      {/* Filtro por tipo de persona (corregido) */}
      <div className="relative w-1/4">
      <select
          className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none"
          value={filters.personType}
          onChange={handlePersonTypeChange}
        >
          <option value="">SELECCIÓN DE TIPO DE PERSONA</option>
          {personTypes.map((type, index) => (
            <option key={index} value={type.personTypeId}>
              {type.typeName}
            </option>
          ))}
        </select>
        <span className="absolute top-3 right-4 text-gray-400">
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Filtro por fecha */}
      <div className="w-1/3">
        <p className="text-gray-500 text-sm text-center mb-1">Filtrar por fecha de registro</p>
        <div className="flex items-center bg-gray-100 rounded-full p-1 w-full border border-gray-300">
          <span className="px-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="date"
            name="startDate"
            className="flex-1 px-3 py-1 bg-transparent focus:outline-none text-gray-500 text-sm"
            value={filters.startDate || ""}
            onChange={handleDateChange}
          />
          <div className="h-6 w-px bg-gray-400 mx-2" />
          <input
            type="date"
            name="endDate"
            className="flex-1 px-3 py-1 bg-transparent focus:outline-none text-gray-500 text-sm"
            value={filters.endDate || ""}
            onChange={handleDateChange}
          />
        </div>
        <div className="flex justify-between text-gray-400 text-xs px-2 mt-1">
          <span>Inicio</span>
          <span>Fin</span>
        </div>
      </div>

      {/* Botón Filtrar */}
      <button
        className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-orange-600"
        onClick={onApplyFilters}
      >
        Filtrar
      </button>
    </div>
  );
};

export default InputFilter;