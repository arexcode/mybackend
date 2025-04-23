import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export function NavBar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Función para verificar la autenticación
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    };

    useEffect(() => {
        // Verificar autenticación al cargar
        checkAuth();

        // Crear listeners para eventos de autenticación
        window.addEventListener('login', checkAuth);
        window.addEventListener('logout', checkAuth);
        
        // Limpieza de event listeners
        return () => {
            window.removeEventListener('login', checkAuth);
            window.removeEventListener('logout', checkAuth);
        };
    }, []);

    return (
        <nav className="bg-black shadow-lg">
            <div className="flex justify-around items-center h-20">
                <div>
                    <h4 className="text-white text-xl font-semibold"> DIGITAL BUHO S.A.C </h4>
                </div>
                {isAuthenticated && (
                    <div className="flex space-x-6">
                        <Link className="text-white font-normal hover:text-blue-300 transition-colors" to={'/'}> Inicio </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}