import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mensaje, setMensaje] = useState('')
   const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:4000/api/saludo')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`)
        }

        return response.json()
      })
      .then(data => setMensaje(data.mensaje))
      .catch(error => setError(error.message));
  }, []);

  return (
    <>
       <h1>Bienvenido a Acadex</h1>
      <p>{error || mensaje || 'Esperando respuesta de la API...'}</p>
    </>
  )
}

export default App
