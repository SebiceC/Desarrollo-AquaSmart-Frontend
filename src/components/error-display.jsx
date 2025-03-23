"use client"
import BackButton from "../components/BackButton"

const ErrorDisplay = ({ title = "Error al cargar datos", message, backTo, backText = "Volver", icon }) => {
  return (
    <div className="max-w-3xl mx-auto p-8 mt-32">
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-md">
        <div className="flex items-center mb-4">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            {icon || (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-semibold text-red-700">{title}</h2>
        </div>
        <p className="text-gray-700 mb-4">{message}</p>
        <div className="flex mt-6">
          <BackButton to={backTo} text={backText} />
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay