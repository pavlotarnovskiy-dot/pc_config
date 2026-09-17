import axios from 'axios';

// ---------------------------------------------------------
// 1️⃣ ВАРІАНТ ДЛЯ CREATE REACT APP (CRA) АБО NEXT.JS:
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api/";

// 2️⃣ ВАРІАНТ ДЛЯ VITE (якщо в тебе Vite, розкоментуй рядок нижче, а верхній закоментуй):
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/";
// ---------------------------------------------------------

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// СПИСОК УСІХ АДРЕС
export const endpoints = {
    auth: {
        login: '/auth/sign-in',
        register: '/auth/sign-up',
        profile: '/auth/me',
        changePassword: '/auth/change-password',
    },
    components: {
        getAll: '/components',
    },
    builder: {
        validate: '/validate',
        recommend: '/recommend',
    },
    orders: {
        create: '/orders',
        getMyOrders: '/orders/my'
    }
};

// Автоматичне додавання токена до запитів
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
