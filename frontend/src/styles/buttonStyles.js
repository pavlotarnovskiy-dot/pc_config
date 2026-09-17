// Глобальні стилі для кнопок
export const buttonStyles = {
  // Основна кнопка (як "Зібрати ПК")
  primary: {
    padding: '12px 28px',
    background: 'linear-gradient(45deg, #d50000, #b71c1c)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(213, 0, 0, 0.2)',
    letterSpacing: '1px',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Вторинна кнопка
  secondary: {
    padding: '12px 28px',
    background: 'transparent',
    color: '#e0e0e0',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    letterSpacing: '1px',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Небольша кнопка (для компонентів)
  small: {
    padding: '8px 16px',
    background: 'linear-gradient(45deg, #d50000, #b71c1c)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(213, 0, 0, 0.2)',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Кнопка з іконкою
  withIcon: {
    padding: '10px 20px',
    background: 'linear-gradient(45deg, #d50000, #b71c1c)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 3px 12px rgba(213, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Montserrat', sans-serif",
  },
};

// Функція для генерації hover стилю
export const getPrimaryButtonHoverStyle = () => ({
  ...buttonStyles.primary,
  boxShadow: '0 6px 25px rgba(213, 0, 0, 0.4)',
  transform: 'translateY(-2px)',
});

export const getSecondaryButtonHoverStyle = () => ({
  ...buttonStyles.secondary,
  borderColor: 'rgba(255, 255, 255, 0.6)',
  background: 'rgba(255, 255, 255, 0.05)',
});
