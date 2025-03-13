import React, { useState } from "react";
import { Search } from "lucide-react";
import { validateField } from "./ValidationRules"; // Importa la función de validación

const InputFilter = ({ personTypes }) => {
  const [idValue, setIdValue] = useState(""); // Estado para el valor del input de ID
  const [errors, setErrors] = useState({}); // Estado para manejar errores

  // Función para manejar cambios en el input de ID
  const handleIdChange = (e) => {
    const { value } = e.target;
    setIdValue(value);

    // Validar el campo usando la función validateField
    const validationErrors = validateField("document", value, {}); // Usamos "document" como nombre porque tiene reglas similares
    setErrors(validationErrors);
  };

  return (
    <div className="p-4 rounded-lg flex items-center justify-between">
      {/* Filtro por ID */}
      <div className="relative w-1/4">
        <span className="absolute left-3 top-2 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          name="document" // Usamos "document" para aplicar las reglas de validación
          placeholder="Filtrar por ID"
          className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none"
          value={idValue}
          onChange={handleIdChange}
          maxLength={15}
        />
        {/* Mostrar mensaje de error si existe */}
        {errors.document && (
          <p className="text-red-500 text-xs mt-1">{errors.document}</p>
        )}
      </div>

      {/* Filtro por tipo de persona */}
      <div className="relative w-1/4">
        <select
          className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {/* Filtro por fecha */}
      <div className="w-1/3">
        <p className="text-gray-500 text-sm text-center mb-1">
          filtrar por fecha de registro
        </p>
        <div className="flex items-center bg-gray-100 rounded-full p-1 w-full border border-gray-300">
          <span className="px-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="date"
            className="flex-1 px-3 py-1 bg-transparent focus:outline-none text-gray-500 text-sm"
          />
          <div className="h-6 w-px bg-gray-400 mx-2" />
          <input
            type="date"
            className="flex-1 px-3 py-1 bg-transparent focus:outline-none text-gray-500 text-sm"
          />
        </div>
        <div className="flex justify-between text-gray-400 text-xs px-2 mt-1">
          <span>inicio</span>
          <span>fin</span>
        </div>
      </div>

      {/* Botón Filtrar */}
      <button className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-orange-600">
        Filtrar
      </button>
    </div>
  );
};

export default InputFilter;