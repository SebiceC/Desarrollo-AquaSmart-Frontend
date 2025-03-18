// DataTable.jsx
import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

const DataTable = ({
  columns,
  data,
  emptyMessage = "No hay datos para mostrar.",
  onView,
  onEdit,
  onDelete,
  actions = true,
  showStatus = true,
}) => {
  // Verifica si hay datos para mostrar
  const isEmpty = data.length === 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.responsive ? column.responsive : ""
                }`}
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isEmpty ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-4 text-gray-500 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-100">
                {columns.map((column) => (
                  <td
                    key={`${index}-${column.key}`}
                    className={`px-4 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      column.responsive ? column.responsive : ""
                    }`}
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key] !== undefined
                      ? item[column.key]
                      : ""}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-4 whitespace-nowrap space-x-2 text-sm text-gray-900">
                    <div className="flex space-x-1 justify-start">
                      {onDelete && item.is_active && (
                        <button
                          className="bg-red-500 hover:bg-red-600 transition-colors p-1.5 rounded-md min-w-[28px] min-h-[28px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="text-white" />
                        </button>
                      )}
                      {onView && (
                        <button
                          className="bg-[#18864B] p-1.5 rounded-lg min-w-[28px]"
                          onClick={() => onView(item)}
                        >
                          <Eye className="text-white" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          className="bg-blue-400 hover:bg-blue-500 transition-colors p-1.5 rounded-md min-w-[28px] min-h-[28px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                          onClick={() => onEdit(item)}
                          aria-label="Editar información"
                        >
                          <Pencil className="text-white" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;