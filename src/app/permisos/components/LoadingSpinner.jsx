const LoadingSpinner = ({ message = "Cargando datos..." }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#365486] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

