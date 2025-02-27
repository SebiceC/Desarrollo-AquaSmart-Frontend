import React from 'react'
import InputItem from '../../components/InputItem'

const PreRegister = () => {
  return (
    <div className='w-full h-full min-h-screen bg-white'>
      <div className='h-full bg-[#DCF2F1] flex mx-auto justify-center'>
        <img src="/img/logo.png" alt="Logo" className='w-[15%] lg:w-[30%]' />
      </div>
      <div className="">
        <form  className='flex flex-col items-center w-full'>
          <InputItem
            id="document"
            labelName="Cédula de Ciudadanía"
            placeholder="Ingresa tu Cédula de Ciudadanía"
            type="string"
            
          />
          
          
          <button type="submit" className="w-[50%] sm:w-[45%] mt-4 bg-[#365486] text-white py-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300 ease-in-out">
            Registro
          </button>
        </form>
      </div>
    </div>
  )
}

export default PreRegister
