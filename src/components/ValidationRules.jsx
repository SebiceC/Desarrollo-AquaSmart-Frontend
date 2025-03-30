export const validateField = (name, value, formData) => {
    const errors = {};
  
    switch (name) {
      case "first_name":
      case "last_name":
        const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/;
        if (!value) {
          errors[name] = "ERROR, campo vacío";
        } else if (!nameRegex.test(value)) {
          errors[name] = "Solo se permiten letras y espacios";
        } else if (value.length > 20) {
          errors[name] = "Máximo 20 caracteres";
        }
        break;
  
      case "phone":
      case "document":
        const numberRegex = /^\d+$/;
        if (!value) {
          errors[name] = "ERROR, campo vacío";
        } else if (!numberRegex.test(value)) {
          errors[name] = "Solo se permiten números";
        } else if (name === "phone" && value.length > 10) {
          errors[name] = "Máximo 10 caracteres";
        } else if (name === "document" && value.length > 12) {
          errors[name] = "Máximo 12 caracteres";
        } else if (name === "document" && value.length < 6) {
          errors[name] = "Mínimo 6 caracteres";
        } else if (name === "phone" && value.length < 10) {
          errors[name] = "Mínimo 10 caracteres";
        }
        break;
  
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errors[name] = "ERROR, campo vacío";
        } else if (!emailRegex.test(value)) {
          errors[name] = "Formato de correo electrónico inválido";
        } else if (value.length > 50) {
          errors[name] = "Máximo 50 caracteres";
        }
        break;
  
      case "address":
        if (!value) {
          errors[name] = "ERROR, campo vacío";   
        } else if (value.length > 35) {
          errors[name] = "Máximo 35 caracteres";
        }
        break;
  
        case "password":
          const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{}|\\:;"'<>,.?/])(?=.*\d)(?=.{8,})/;
          if (!value) {
            errors[name] = "ERROR, campo vacío";
          } else if (!passwordRegex.test(value)) {
            errors[name] =
              "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial";
          } else if (value.length > 20) {
            errors[name] = "Máximo 20 caracteres";
          }
          break;
  
      case "confirmPassword":
        if (!value) {
          errors[name] = "ERROR, campo vacío";
        } else if (value !== formData.password) {
          errors[name] = "Las contraseñas no coinciden.";
        } else if (value.length > 20) {
          errors[name] = "Máximo 20 caracteres";
        }
        break;

      case "person_type":
        if (!value) {
          errors[name] = "ERROR, campo vacío";
        }
        break;

      case "attachments":
        if (Array.isArray(value)) {
          if (value.length > 5) {
            errors[name] = "Máximo 5 archivos permitidos";
          } else {
            const invalidFile = value.find(file => file.type !== "application/pdf");
            if (invalidFile) {
              errors[name] = `El archivo ${invalidFile.name} debe ser PDF`;
            } else {
              const largeFile = value.find(file => file.size > 500000);
              if (largeFile) {
                errors[name] = `El archivo ${largeFile.name} excede los 500KB`;
              }
            }
          }
        }
        break;
  
      default:
        break;
    }
  
    return errors;
  };
