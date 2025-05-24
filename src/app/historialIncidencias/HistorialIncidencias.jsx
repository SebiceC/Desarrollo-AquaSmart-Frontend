import React, { useState } from 'react'
import NavBar from '../../components/NavBar'
import InputFilterIncidencias from '../../components/InputFilterIncidencias'

function HistorialIncidencias() {

// Filter states
    const [filters, setFilters] = useState({
        id: "",
        startDate: "",
        endDate: "",
        accion: "",
    });

// Update filters
    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value,
        });
    };

  return (
    <div>
        <NavBar/>
        <div className="container mx-auto p-4 md:p-8 lg:p-20">
                <h1 className="text-center my-10 text-lg md:text-2xl font-bold mb-6">
                    HISTORIAL DE INCIDENCIAS
                </h1>

                <InputFilterIncidencias
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={applyFilters}
                />
        </div>
    </div>
  )
}

export default HistorialIncidencias