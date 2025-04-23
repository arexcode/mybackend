import { Route, Routes, Navigate } from "react-router-dom";
import { HomePage, LoginPage, ProjectDetailsPage } from "../pages";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AdminDashboardView } from "../views/AdminDashboardView";
import { AdminDashboardHomeView } from "../views/AdminDashboardHomeView";
import { AdminUsersView } from "../views/AdminUsersView";
import { AdminProjectsView } from "../views/AdminProjectsView";
import { AdminProjectTasksView } from "../views/AdminProjectTasksView";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

// Componente para proteger rutas de admin (solo staff o superuser)
const AdminProtectedRoute = ({ children }) => {
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const token = localStorage.getItem('token');
    
    useEffect(() => {
        if (!token) {
            setChecking(false);
            return;
        }
        
        try {
            const decoded = jwtDecode(token);
            console.log("Token decodificado:", decoded); // Para depuración
            
            // Solo permitir acceso a usuarios staff o superuser
            if (decoded.is_staff === true || decoded.is_superuser === true) {
                setAuthorized(true);
            }
        } catch (err) {
            console.error('Error al decodificar el token:', err);
        } finally {
            setChecking(false);
        }
    }, [token]);
    
    if (checking) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }
    
    if (!token || !authorized) {
        console.log("No autorizado para acceder al admin dashboard");
        return <Navigate to="/" replace />;
    }
    
    return children;
};

export function AppRouter() {
    const token = localStorage.getItem('token');

    return (
        <Routes>
            <Route path="/login" element={
                token ? <Navigate to="/" replace /> : <LoginPage />
            } />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <HomePage />
                </ProtectedRoute>
            } />

            <Route path="/proyecto/:id" element={
                <ProtectedRoute>
                    <ProjectDetailsPage />
                </ProtectedRoute>
            } />

            {/* Rutas de administración protegidas solo para staff/superuser */}
            <Route path="/admin/*" element={
                <AdminProtectedRoute>
                    <AdminDashboardView />
                </AdminProtectedRoute>
            }>
                <Route index element={<AdminDashboardHomeView />} />
                <Route path="users" element={<AdminUsersView />} />
                <Route path="projects" element={<AdminProjectsView />} />
                <Route path="tasks" element={<AdminProjectTasksView />} />
            </Route>

            <Route path="/*" element={<NotFoundPage />} />
        </Routes>
    );
}