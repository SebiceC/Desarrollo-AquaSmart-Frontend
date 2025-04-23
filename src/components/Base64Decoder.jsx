import React, { useEffect } from 'react';

const Base64Decoder = ({ base64Data, onDataDecoded }) => {
  useEffect(() => {
    if (!base64Data) return;

    const decodePdf = () => {
      try {
        // Verificar si el string base64 tiene una longitud válida
        if (base64Data.length < 100) {
          throw new Error("El string base64 es demasiado corto para ser un PDF válido");
        }

        // Limpiar el string base64 (eliminar posibles prefijos)
        let cleanBase64 = base64Data;
        if (base64Data.includes(',')) {
          cleanBase64 = base64Data.split(',')[1];
        }
        
        // Validar que sea base64 válido
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        if (!base64Regex.test(cleanBase64)) {
          throw new Error("El string contiene caracteres no válidos para base64");
        }
        
        // Intentar decodificar
        let byteCharacters;
        try {
          byteCharacters = atob(cleanBase64);
        } catch (e) {
          throw new Error("Error al decodificar el base64: " + e.message);
        }
        
        // Verificar primeros bytes para asegurar que es un PDF
        const firstBytes = byteCharacters.substring(0, 8);
        if (!firstBytes.includes('PDF')) {
          throw new Error("El contenido decodificado no parece ser un PDF válido");
        }

        // Convertir a un array de bytes
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        
        // Crear el blob y la URL
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        
        // Verificar que el blob no esté vacío
        if (blob.size === 0) {
          throw new Error("El PDF generado está vacío");
        }
        
        // Informar al componente padre
        onDataDecoded(pdfUrl);
      } catch (error) {
        console.error('Error al decodificar el PDF:', error);
        onDataDecoded(null, error.message);
      }
    };
    
    // Añadir un pequeño retraso para evitar bloqueos en la UI
    const timer = setTimeout(() => {
      decodePdf();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [base64Data]); // Solo incluimos base64Data como dependencia
  
  // Este componente no renderiza nada visible
  return null;
};

export default Base64Decoder;