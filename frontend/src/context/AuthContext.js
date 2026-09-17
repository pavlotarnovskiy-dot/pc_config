import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, endpoints } from '../api/endpoints';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Тут буде ім'я юзера
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Простий валідатор JWT: розбираємо payload і перевіряємо exp (якщо є)
    const isTokenValid = (token) => {
        if (!token) return false;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            const payload = JSON.parse(window.atob(parts[1]));
            if (payload.exp) {
                return payload.exp * 1000 > Date.now();
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    // Перевірка при завантаженні сайту: чи є токен та чи він валідний?
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedName = localStorage.getItem('username');

        if (token && isTokenValid(token)) {
            setIsAuthenticated(true);
            setUser({ name: savedName || 'User' });
        } else {
            // Якщо токен невалідний або його немає — чистимо локалсторедж
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            setIsAuthenticated(false);
            setUser(null);
        }

        setLoading(false);
    }, []);

    // Функція ВХОДУ (Login)
    const login = async (email, password) => {
        try {
            const response = await api.post(endpoints.auth.login, { email, password });

            // Сервер повертає { token: "..." }
            const { token } = response.data;

            // Зберігаємо токен
            localStorage.setItem('token', token);
            localStorage.setItem('username', email.split('@')[0]); // Тимчасово беремо ім'я з пошти

            setIsAuthenticated(true);
            setUser({ name: email.split('@')[0] });
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, message: error.response?.data?.error || "Помилка входу" };
        }
    };

    // Функція РЕЄСТРАЦІЇ (Register)
    const register = async (name, email, password) => {
        try {
            await api.post(endpoints.auth.register, { name, email, password });
            // Після успішної реєстрації відразу логінимося
            return await login(email, password);
        } catch (error) {
            console.error("Registration failed:", error);
            return { success: false, message: error.response?.data?.error || "Помилка реєстрації" };
        }
    };

    // Функція ВИХОДУ
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};