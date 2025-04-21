import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/context/AuthProvider.jsx';
import { PermissionsProvider } from './app/context/PermissionsContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PermissionsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>

      </PermissionsProvider>
    </AuthProvider>
  </StrictMode>,
)