import React from 'react';

const DownloadButton = ({ pdfUrl, fileName = 'factura.pdf' }) => {
  const handleDownload = () => {
    if (!pdfUrl) return;
    
    // Crear un elemento <a> para iniciar la descarga
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <button 
      onClick={handleDownload}
      className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 w-full lg:w-auto"
      disabled={!pdfUrl}
    >
      Descargar PDF
    </button>
  );
};

export default DownloadButton;