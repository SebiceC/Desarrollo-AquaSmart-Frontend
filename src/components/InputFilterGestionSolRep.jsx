import React from "react";
import { Search } from "lucide-react";

const InputFilterGestionSolRep = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  showStatusFilter = true,
  showPersonTypeFilter = true // Este ya no se usa pero lo dejamos por compatibilidad
}) => {
  const handleIdChange = (e) => {
    onFilterChange("id", e.target.value);
  };

  const handleUserIdChange = (e) => {
    onFilterChange("userId", e.target.value);
  };

  const handleTypeChange = (e) => {
    onFilterChange("solicitudType", e.target.value);
  };

  const handleStatusChange = (e) => {
    onFilterChange("status", e.target.value);
  };

  const handleDateChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };

  return (
    <div className="p-4 rounded-lg flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
      {/* Filtro por ID de usuario */}
      <div className="relative w-full lg:w-[22%] xl:w-1/5">
        <span className="absolute left-3 top-2 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="ID de usuario"
          className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
          value={filters.userId}
          onChange={handleUserIdChange}
          maxLength={15}
        />
      </div>



      {/* Filtro por ID de reporte/solicitud */}
      <div className="relative w-full lg:w-[22%] xl:w-1/5">
        <span className="absolute left-3 top-2 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="ID de reporte/solicitud"
          className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
          value={filters.id}
          onChange={handleIdChange}
          maxLength={10}
        />
      </div>

            {/* Filtro por tipo (Reporte/Solicitud) */}
            <div className="relative w-full lg:w-[22%] xl:w-1/5">
        <select
          className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
          value={filters.solicitudType}
          onChange={handleTypeChange}
        >
          <option value="">TIPO</option>
          <option value="solicitud">Solicitud</option>
          <option value="reporte">Reporte</option>
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

      {/* Filtro por Estado */}
      {showStatusFilter && (
        <div className="relative w-full lg:w-[22%] xl:w-1/5">
          <select
            className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="">ESTADO</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
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
      )}

      {/* Filtro por Fecha de Generación */}
      <div className="w-full lg:w-[40%] xl:w-1/3">
        <p className="text-gray-500 text-sm text-center mb-1">Filtrar por fecha de generación</p>
        <div className="flex items-center bg-gray-100 rounded-full px-1 w-full border border-gray-300">
          {/* Icono de búsqueda */}
          <span className="text-gray-400 px-2 flex-shrink-0">
            <Search size={18} />
          </span>

          {/* Input de fecha Inicio */}
          <input
            type="date"
            name="startDate"
            className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
            value={filters.startDate || ""}
            onChange={handleDateChange}
          />

          {/* Separador */}
          <span className="text-gray-400 px-2 flex-shrink-0">|</span>

          {/* Input de fecha Fin */}
          <input
            type="date"
            name="endDate"
            className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
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
        className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 w-full lg:w-auto"
        onClick={onApplyFilters}
      >
        Filtrar
      </button>
    </div>
  );
};

export default InputFilterGestionSolRep;