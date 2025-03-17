import React from "react";

const Button = ({
  onClick,
  text,
  color = "bg-[#365486]",
  hoverColor = "hover:bg-[#2f4275]",
  textColor = "text-white",
  size = "px-4 py-2",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`${
        disabled ? "bg-gray-400 cursor-not-allowed" : color
      } ${hoverColor} ${textColor} ${size} rounded-lg transition-colors`}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
