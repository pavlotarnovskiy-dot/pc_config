import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div style={styles.container}>
            {/* HERO SECTION */}
            <div style={styles.heroSection}>
                {/* Фоновий ефект світіння по центру */}
                <div style={styles.glowBlob}></div>

                <h1 className="animate-fade-in" style={styles.title}>
                    BUILD YOUR <span style={styles.redText}>BEAST</span>
                </h1>

                <p className="animate-fade-in delay-100" style={styles.subtitle}>
                    Професійна система підбору комплектуючих.<br />
                    <span style={{ color: '#fff' }}>Максимальна продуктивність.</span> Повна сумісність.
                </p>

                <div className="animate-fade-in delay-200" style={styles.buttonGroup}>
                    <Link to="/build" style={styles.primaryBtn}>
                        ПОЧАТИ ЗБІРКУ <span style={{ fontSize: '1.2rem' }}>🚀</span>
                    </Link>
                    <Link to="/recommend" style={styles.secondaryBtn}>
                        ПІДБІР ЗА ГРОЮ 🎮
                    </Link>
                    <Link to="/catalog" style={styles.secondaryBtn}>
                        КАТАЛОГ ДЕТАЛЕЙ
                    </Link>
                </div>
            </div>

            {/* FEATURES SECTION */}
            <div style={styles.featuresContainer}>
                <FeatureCard
                    delay="delay-100"
                    icon="⚡"
                    title="АВТО-СУМІСНІСТЬ"
                    desc="Розумні алгоритми автоматично перевіряють Socket, TDP, RAM та розміри корпусу."
                />
                <FeatureCard
                    delay="delay-200"
                    icon="🎮"
                    title="GAME READY"
                    desc="Оптимізовано для геймерів. Підбір найкращих зв'язок CPU + GPU для FPS."
                />
                <FeatureCard
                    delay="delay-300"
                    icon="🚀"
                    title="ШВИДКІСТЬ"
                    desc="Миттєвий аналіз тисяч комбінацій."
                />
            </div>
        </div>
    );
};

// Компонент картки з ефектом наведення
const FeatureCard = ({ title, desc, icon, delay }) => (
    <div className={`glass-panel animate-fade-in ${delay}`} style={styles.featureCard}>
        <div style={styles.iconCircle}>{icon}</div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardDesc}>{desc}</p>
    </div>
);

const styles = {
    container: {
        minHeight: 'calc(100vh - 80px)', // На весь екран мінус хедер
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative'
    },
    heroSection: {
        textAlign: 'center',
        marginBottom: '80px',
        position: 'relative',
        zIndex: 2
    },
    // Це створює червоне світіння за текстом
    glowBlob: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(213,0,0,0.15) 0%, rgba(0,0,0,0) 70%)',
        zIndex: -1,
        pointerEvents: 'none'
    },
    title: {
        fontFamily: "'Orbitron', sans-serif", // Геймерський шрифт
        fontSize: '4.5rem',
        color: '#fff',
        marginBottom: '20px',
        fontWeight: '900',
        letterSpacing: '3px',
        textShadow: '0 0 20px rgba(0,0,0,0.8)'
    },
    redText: {
        color: '#ff1744',
        textShadow: '0 0 15px rgba(255, 23, 68, 0.6)' // Неонове світіння
    },
    subtitle: {
        fontSize: '1.2rem',
        color: '#aaa',
        marginBottom: '50px',
        lineHeight: '1.6',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px'
    },
    primaryBtn: {
        padding: '16px 40px',
        textDecoration: 'none',
        borderRadius: '50px', // Більш сучасні круглі кнопки
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: 'white',
        background: 'linear-gradient(45deg, #d50000, #ff1744)', // Градієнт
        boxShadow: '0 4px 15px rgba(213, 0, 0, 0.4)',
        animation: 'pulseGlow 3s infinite', // Кнопка "дихає"
        transition: 'transform 0.2s ease'
    },
    secondaryBtn: {
        padding: '16px 40px',
        textDecoration: 'none',
        borderRadius: '50px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: '#fff',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(5px)',
        transition: 'all 0.3s ease'
    },
    featuresContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap',
        maxWidth: '1200px',
        width: '100%'
    },
    featureCard: {
        padding: '30px',
        borderRadius: '16px', // Округлені картки
        width: '300px',
        textAlign: 'left',
        transition: 'transform 0.3s ease, border-color 0.3s',
        cursor: 'default'
    },
    iconCircle: {
        width: '50px',
        height: '50px',
        background: 'rgba(213, 0, 0, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '20px',
        border: '1px solid rgba(213, 0, 0, 0.3)'
    },
    cardTitle: {
        color: '#fff',
        marginTop: 0,
        marginBottom: '10px',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '1.1rem',
        letterSpacing: '1px'
    },
    cardDesc: {
        color: '#aaa',
        fontSize: '0.95rem',
        lineHeight: '1.5'
    }
};

export default Home;