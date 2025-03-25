import React from "react";
import { Search } from "lucide-react";

const InputFilterPlotLotUser = ({ filters, onFilterChange, onApplyFilters }) => {
  const handleIdChange = (e) => {
    onFilterChange("id", e.target.value);
  };

  const handlePlotNameChange = (e) => {
    onFilterChange("name", e.target.value);
  };

  return (
    <div className="p-4 rounded-lg flex flex-col lg:flex-row gap-4 items-center justify-center">
      <div className="w-full flex flex-col sm:flex-row gap-3 items-center">
        {/* Filtro por ID */}
        <div className="relative w-full sm:w-1/2">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Filtrar por ID de predio"
            className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
            value={filters.id}
            onChange={handleIdChange}
            maxLength={10}
          />
        </div>

        {/* Filtro por nombre del predio */}
        <div className="relative w-full sm:w-1/2">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Nombre del predio"
            className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
            value={filters.name}
            onChange={handlePlotNameChange}
            maxLength={50}
          />
        </div>

        {/* Botón Filtrar */}
        <button
          className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 w-full sm:w-auto mt-2 sm:mt-0"
          onClick={onApplyFilters}
        >
          Filtrar
        </button>
      </div>
    </div>
  );
};

export default InputFilterPlotLotUser;