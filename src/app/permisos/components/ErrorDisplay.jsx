"use client"

const ErrorDisplay = ({ error, resetError, retryAction }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center bg-red-50 p-8 rounded-lg max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={() => {
            if (resetError) resetError(null)
            if (retryAction) retryAction()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}

export default ErrorDisplay

