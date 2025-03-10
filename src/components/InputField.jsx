import React from "react";

const InputField = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  className,
}) => {
  return (
    <div>
      <label>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded px-3 py-2 ${
          error ? "bg-red-100" : "bg-white"
        } ${className}`}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
      />
      {error && <p className="text-[#F90000]">{error}</p>}
    </div>
  );
};

export default InputField;