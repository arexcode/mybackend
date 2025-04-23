import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const LogoutButton = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Limpiar tokens del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        
        // Mostrar mensaje de éxito
        toast.success('Sesión cerrada exitosamente');
        
        // Redirigir al login
        navigate('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Cerrar Sesión
        </button>
    );
}; 