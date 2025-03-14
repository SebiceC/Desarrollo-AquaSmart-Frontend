
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
        } else if (name === "document" && value.length > 15) {
          errors[name] = "Máximo 15 caracteres";
        } else if (name === "document" && value.length < 6) {
          errors[name] = "Mínimo 6 caracteres";
        } else if (name === "phone" && value.length < 8) {
          errors[name] = "Mínimo 8 caracteres";
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
        errors[name] = "Máximo 20 caracteres";
      }
        break;
  
      case "password":
        const passwordRegex = /^(?=.*[A-Z])(?=.*[._!@#$%^&*])(?=.*\d)(?=.{8,})/;
        if (!value) {
          errors[name] = "ERROR, campo vacío";
        } else if (!passwordRegex.test(value)) {
          errors[name] =
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, un numero y un carácter especial";
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
  
      default:
        break;
    }
  
    return errors;
  };
