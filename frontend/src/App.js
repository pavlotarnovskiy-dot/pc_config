import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BuilderProvider } from './context/BuilderContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import BuildPage from './pages/BuildPage';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import RecommendationPage from './pages/RecommendationPage';
import ComparisonPage from './pages/ComparisonPage';

// --- ОКРЕМИЙ КОМПОНЕНТ ШАПКИ (Header) ---
// Ми винесли його сюди, щоб він міг використовувати хук useAuth()
const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { pathname } = useLocation();

  // Скорочення імені
  const formatName = (name) => {
    if (!name) return 'User';
    const shortName = name.includes('@') ? name.split('@')[0] : name;
    return shortName.length > 10 ? shortName.substring(0, 8) + '..' : shortName;
  };

  // Функція для визначення активної кнопки
  const getNavButtonStyle = (path) => {
    const isActive = pathname === path;
    return {
      ...baseBtnStyle,
      background: isActive ? 'rgba(213, 0, 0, 0.2)' : 'transparent',
      border: isActive ? '1px solid #d50000' : '1px solid rgba(255, 255, 255, 0.3)',
      color: isActive ? '#ff5555' : '#e0e0e0',
      boxShadow: isActive ? '0 0 10px rgba(213, 0, 0, 0.3)' : 'none'
    };
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/auth'; // Перенаправляємо на сторінку входу
  };

  return (
    <header style={headerStyle}>
      <div style={headerContainerStyle}>
        
        {/* 1. ЛОГОТИП (Завжди видно) */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={logoIconStyle}>⚡</div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.6rem', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>
            PC<span style={{ color: '#d50000' }}>CONFIG</span>
          </div>
        </Link>

        {/* 2. ПРАВА ЧАСТИНА (Змінюється залежно від входу) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            
            {/* ПОКАЗУЄМО ЦЕ ТІЛЬКИ ЯКЩО УВІЙШОВ */}
            {isAuthenticated ? (
                <>
                    <Link to="/catalog" style={getNavButtonStyle('/catalog')}>
                        КАТАЛОГ
                    </Link>

                    <Link to="/comparison" style={getNavButtonStyle('/comparison')}>
                        📊 ПОРІВНЯННЯ
                    </Link>

                    <Link to="/recommend" style={getNavButtonStyle('/recommend')}>
                        🎮 ПІДБІР
                    </Link>

                    <Link to="/build" style={getNavButtonStyle('/build')}>
                        ЗІБРАТИ ПК 🚀
                    </Link>

                    <div style={{ width: '1px', height: '25px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }}></div>

                    {/* Профіль - клікаємо щоб перейти на сторінку профілю */}
                    <Link to="/profile" style={{...userBadgeStyle, textDecoration: 'none', cursor: 'pointer'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '10px' }}>
                            <span style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: '1' }}>КОРИСТУВАЧ</span>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', lineHeight: '1.2' }}>
                                {formatName(user?.name)}
                            </span>
                        </div>
                        <button onClick={handleLogout} style={logoutBtnStyle} title="Вийти">⏻</button>
                    </Link>
                </>
            ) : (
                // ЯКЩО НЕ УВІЙШОВ - ТІЛЬКИ КНОПКА ВХОДУ
                <Link to="/auth" style={loginBtnStyle}>
                    УВІЙТИ В СИСТЕМУ
                </Link>
            )}

        </div>

      </div>
    </header>
  );
};

// --- ГОЛОВНИЙ КОМПОНЕНТ APP ---
function App() {
  return (
    <AuthProvider>
      <BuilderProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            {/* Використовуємо наш розумний Header */}
            <Header />

            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/recommend" element={<RecommendationPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                
                {/* Захищені маршрути */}
                <Route 
                  path="/catalog" 
                  element={
                    <ProtectedRoute>
                      <Catalog />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/build" 
                  element={
                    <ProtectedRoute>
                      <BuildPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>

            <footer style={{ backgroundColor: '#050505', padding: '30px', textAlign: 'center', color: '#444', borderTop: '1px solid #111', fontSize: '0.8rem' }}>
              SYSTEM VERSION 1.0 // © 2025 STUDENT Mykola Zibrov
            </footer>

          </div>
        </Router>
      </BuilderProvider>
    </AuthProvider>
  );
}

// --- СТИЛІ ---

const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(5, 5, 5, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '12px 0',
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
};

const headerContainerStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  boxSizing: 'border-box'
};

const logoIconStyle = {
  width: '32px', height: '32px',
  backgroundColor: '#d50000',
  color: 'white',
  borderRadius: '4px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 'bold', fontSize: '1.2rem',
  boxShadow: '0 0 15px rgba(213, 0, 0, 0.5)'
};

const baseBtnStyle = {
  display: 'flex', alignItems: 'center', textDecoration: 'none',
  padding: '0 20px', borderRadius: '4px', fontWeight: '700', fontSize: '0.8rem',
  height: '38px', boxSizing: 'border-box', letterSpacing: '1px',
  transition: 'all 0.2s', fontFamily: "'Montserrat', sans-serif"
};

const loginBtnStyle = {
    ...baseBtnStyle,
    color: '#d50000',
    borderColor: '#d50000',
    border: '1px solid #d50000',
    background: 'transparent',
    padding: '0 30px' // Трохи ширша кнопка входу
};

const userBadgeStyle = {
  display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)',
  padding: '0 10px 0 15px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)',
  height: '38px', boxSizing: 'border-box'
};

const logoutBtnStyle = {
  background: 'transparent', border: 'none', color: '#666', fontWeight: 'bold',
  cursor: 'pointer', fontSize: '1.1rem', padding: '0 0 0 10px', marginLeft: '10px',
  borderLeft: '1px solid #333', height: '20px', display: 'flex', alignItems: 'center',
  transition: 'color 0.2s'
};

export default App;
