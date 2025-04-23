import { Route, Routes, Navigate } from "react-router-dom";
import { HomePage, LoginPage } from "../pages";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { NotFoundPage } from "../pages/NotFoundPage";

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

            <Route path="/*" element={<NotFoundPage />} />
        </Routes>
    );
}