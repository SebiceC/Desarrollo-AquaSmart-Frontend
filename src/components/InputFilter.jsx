import React, { useState } from "react";
import { Search } from "lucide-react";

const InputFilter = ({ personTypes, filters, onFilterChange, onApplyFilters }) => {
  const handleIdChange = (e) => {
    onFilterChange("id", e.target.value);
  };

  const handlePersonTypeChange = (e) => {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    onFilterChange("personType", value);
  };

  const handleDateChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };

  return (
    <div className="p-4 rounded-lg flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      {/* Filtro por Documento */}
      <div className="relative w-full md:w-1/4">
        <span className="absolute left-3 top-2 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Filtrar por documento"
          className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
          value={filters.id}
          onChange={handleIdChange}
          maxLength={15}
        />
      </div>

      {/* Filtro por tipo de persona */}
      <div className="relative w-full md:w-1/4">
        <select
          className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
          value={filters.personType}
          onChange={handlePersonTypeChange}
        >
          <option value=""> SELECCION DE TIPO DE PERSONA</option>
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

      {/* Filtro por Fecha de Registro */}
      <div className="w-full md:w-1/3">
        <p className="text-gray-500 text-sm text-center mb-1">Filtrar por fecha de registro</p>
        <div className="flex items-center bg-gray-100 rounded-full px-1 w-full border border-gray-300">
          {/* Icono de búsqueda */}
          <span className="text-gray-400 px-2">
            <Search size={18} />
          </span>

          {/* Input de fecha Inicio */}
          <input
            type="date"
            name="startDate"
            className="w-full px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
            value={filters.startDate || ""}
            onChange={handleDateChange}
          />

          {/* Separador */}
          <span className="text-gray-400 px-2">|</span>

          {/* Input de fecha Fin */}
          <input
            type="date"
            name="endDate"
            className="w-full px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
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
        className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 w-full md:w-auto"
        onClick={onApplyFilters}
      >
        Filtrar
      </button>
    </div>
  );
};

export default InputFilter;
