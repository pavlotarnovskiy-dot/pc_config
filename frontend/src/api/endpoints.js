import axios from 'axios';


const API_URL = "http://localhost:8080/api/";

export const api = axios.create({
    // ✅ Виправлено: використовуємо правильну змінну API_URL
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
