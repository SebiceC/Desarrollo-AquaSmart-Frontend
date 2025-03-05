import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom' // Asegúrate de importar Navigate
import Login from '../app/auth/Login'
import PreRegister from '../app/auth/PreRegister'
import Home from '../Home'
import ForgotPassword from '../app/forgotPassword/ForgotPassword'
import RecoverPassword from '../app/forgotPassword/RecoverPassword'
import Perfil from '../app/Perfil'
import IoTControll from '../app/IoTControll'

const AppRouter = () => {
  return (
    <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='/home' element={<Navigate to="/perfil" replace />} />
        <Route path='/preRegister' element={<PreRegister />} />
        <Route path='/login' element={<Login />} />
        <Route path='/forgotPassword' element={<ForgotPassword />} />
        <Route path='/recoverPassword' element={<RecoverPassword />} />
        <Route path='/perfil' element={<Perfil />} />
        <Route path='/control-IoT' element={<IoTControll />} />

        
    </Routes>
  )
}

export default AppRouter;
