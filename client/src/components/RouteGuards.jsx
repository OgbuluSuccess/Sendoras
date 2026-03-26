import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/auth';

/**
 * PrivateRoute — only renders children if the user has a valid token.
 * Otherwise redirects to /login.
 */
export const PrivateRoute = () => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    return token && user ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * PublicRoute — for pages like /login and /signup.
 * If the user is already authenticated, redirect them to the dashboard.
 */
export const PublicRoute = () => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    return token && user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
