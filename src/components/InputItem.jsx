import React from 'react'

const InputItem = ({ labelName, id, name, placeholder, type, ...rest }) => {
  return (
    <div className='w-[85%]'>
      <label htmlFor={id} className="text-black font-medium pb-5">
        {labelName}
      </label>
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        className="w-full bg-white border-2 px-4 py-2 mb-5 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#365486]"
        type={type}
        // ref={ref}
        {...rest}
      />
    </div>
  )
}

export default InputItem