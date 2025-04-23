import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export function AdminDashboardView() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar si el usuario tiene permisos de staff o superuser
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
        
        // Verificar si el usuario es staff o superuser
        if (decoded.is_staff === true || decoded.is_superuser === true) {
          setIsAuthorized(true);
        } else {
          // Redirigir a home si no tiene permisos
          console.log("Usuario no autorizado en AdminDashboardView:", decoded);
          navigate('/');
        }
      } catch (err) {
        console.error('Error al decodificar el token:', err);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          No tienes permisos para acceder a esta sección. Se requiere ser administrador o staff.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-sm opacity-75">Digital Buho S.A.C</p>
        </div>
        <nav className="mt-6">
          <ul>
            <li>
              <Link 
                to="/admin" 
                className="block py-3 px-6 hover:bg-blue-700 transition-colors"
                end="true"
              >
                Resumen
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className="block py-3 px-6 hover:bg-blue-700 transition-colors"
              >
                Usuarios
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/projects" 
                className="block py-3 px-6 hover:bg-blue-700 transition-colors"
              >
                Proyectos
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/tasks" 
                className="block py-3 px-6 hover:bg-blue-700 transition-colors"
              >
                Tareas
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto p-6">
          <Link to="/" className="block py-2 px-4 bg-blue-700 rounded hover:bg-blue-600 transition-colors text-center">
            Volver a la app
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="mx-auto py-4 px-8 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Panel de Administración
            </h1>
            <div className="flex items-center">
              {currentUser && (
                <span className="mr-4 text-gray-600">
                  {currentUser.email} 
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {currentUser.is_superuser ? 'Superadmin' : 'Staff'}
                  </span>
                </span>
              )}
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.dispatchEvent(new Event('logout'));
                  navigate('/login');
                }}
                className="text-red-600 hover:text-red-800"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 