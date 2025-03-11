import React from 'react'

const InputItem = ({ label,onChange,maxLength,error,className, value,labelName, id, name, placeholder, type, ...rest }) => {
  return (
    <div className='w-[85%]'>
      <label htmlFor={id} className="text-black font-medium pb-5">
        {labelName}
      </label>

      <label htmlFor={id} className="text-black font-low pb-5">
        {label}
      </label>
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
          error ? "bg-red-100" : "bg-white"
        } ${className}`}
        type={type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        
        {...rest}
      />
      {error && <p className="text-[#F90000]">{error}</p>}
    </div>
  )
}

export default InputItem