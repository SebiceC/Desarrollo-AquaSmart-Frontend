import React from 'react'
import NavBar from '../../../components/NavBar'

function UsersList() {
    return (
        <div className="w-full min-h-screen bg-white">
            <NavBar />
            <div className="flex justify-center items-center h-[calc(100vh-4rem)] mt-16">
                <h1>LISTADO DE USUARIOS</h1>
            </div>
        </div>
    )
}

export default UsersList