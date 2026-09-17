import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    // Додали confirmPassword у стейт
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState(null);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // 1. ПЕРЕВІРКА ПАРОЛІВ (Тільки при реєстрації)
        if (!isLoginMode) {
            if (formData.password !== formData.confirmPassword) {
                setError("ПАРОЛІ НЕ СПІВПАДАЮТЬ!");
                return;
            }
        }

        let result;
        if (isLoginMode) {
            result = await login(formData.email, formData.password);
        } else {
            result = await register(formData.name, formData.email, formData.password);
        }

        if (result.success) {
            navigate('/catalog');
        } else {
            setError(result.message);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-panel animate-fade-in" style={styles.card}>
                <h2 style={styles.title}>
                    {isLoginMode ? 'SYSTEM ACCESS' : 'NEW USER'}
                </h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLoginMode && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>USERNAME</label>
                            <input
                                type="text"
                                style={styles.input}
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>EMAIL</label>
                        <input
                            type="email"
                            style={styles.input}
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>PASSWORD</label>
                        <input
                            type="password"
                            style={styles.input}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    {/* ПОЛЕ ПІДТВЕРДЖЕННЯ ПАРОЛЯ */}
                    {!isLoginMode && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>CONFIRM PASSWORD</label>
                            <input
                                type="password"
                                style={styles.input}
                                placeholder="Repeat password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    {error && <div style={styles.error}>{error}</div>}

                    <button type="submit" style={styles.submitBtn}>
                        {isLoginMode ? 'LOGIN' : 'REGISTER'}
                    </button>
                </form>

                <div style={styles.footer}>
                    {isLoginMode ? "Don't have an account? " : "Already have access? "}
                    <span
                        style={styles.link}
                        onClick={() => {
                            setError(null);
                            setIsLoginMode(!isLoginMode);
                            setFormData({ name: '', email: '', password: '', confirmPassword: '' }); // Очистка форми
                        }}
                    >
                        {isLoginMode ? 'Create one' : 'Login here'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '12px', textAlign: 'center' },
    title: { fontFamily: "'Orbitron', sans-serif", color: '#fff', marginBottom: '30px', letterSpacing: '2px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { textAlign: 'left' },
    label: { color: '#d50000', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px', display: 'block' },
    input: {
        width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #333',
        backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '1rem', outline: 'none',
        boxSizing: 'border-box'
    },
    submitBtn: {
        padding: '15px', borderRadius: '4px', border: 'none',
        background: 'linear-gradient(45deg, #d50000, #b71c1c)',
        color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
        marginTop: '10px', letterSpacing: '1px', transition: 'transform 0.2s'
    },
    error: { color: '#ff1744', fontSize: '0.9rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '4px', border: '1px solid #ff1744' },
    footer: { marginTop: '20px', color: '#888', fontSize: '0.9rem' },
    link: { color: '#d50000', cursor: 'pointer', fontWeight: 'bold' }
};

export default AuthPage;