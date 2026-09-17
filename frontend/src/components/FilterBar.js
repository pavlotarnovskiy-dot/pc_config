import React from 'react';

const FilterBar = ({ filters, setFilters }) => {

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="glass-panel" style={styles.container}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", margin: 0, color: '#fff', letterSpacing: '2px', fontSize: '1.2rem' }}>
                    ФІЛЬТРИ
                </h3>
            </div>

            {/* ПОШУК */}
            <div style={styles.group}>
                <label style={styles.label}>ПОШУК</label>
                <input
                    type="text"
                    name="search"
                    placeholder="Назва (напр. ASUS)..."
                    value={filters.search}
                    onChange={handleChange}
                    style={styles.input}
                />
            </div>

            {/* ЦІНА */}
            <div style={styles.group}>
                <label style={styles.label}>ЦІНА (ГРН)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="number" name="min_price" placeholder="Від"
                        value={filters.min_price} onChange={handleChange}
                        style={{ ...styles.input, flex: 1 }}
                    />
                    <input
                        type="number" name="max_price" placeholder="До"
                        value={filters.max_price} onChange={handleChange}
                        style={{ ...styles.input, flex: 1 }}
                    />
                </div>
            </div>

            {/* СОРТУВАННЯ */}
            <div style={styles.group}>
                <label style={styles.label}>СОРТУВАННЯ</label>
                <div style={styles.selectWrapper}>
                    <select name="sort" value={filters.sort} onChange={handleChange} style={styles.select}>
                        <option value="asc" style={styles.option}>▼ Спочатку дешеві</option>
                        <option value="desc" style={styles.option}>▲ Спочатку дорогі</option>
                    </select>
                </div>
            </div>

            {/* КНОПКА СКИНУТИ (Опціонально) */}
            <button
                onClick={() => setFilters({ search: '', min_price: '', max_price: '', sort: 'asc' })}
                style={styles.resetBtn}
            >
                СКИНУТИ
            </button>
        </div>
    );
};

const styles = {
    container: {
        padding: '25px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(10, 10, 10, 0.6)', // Трохи темніший фон
        height: 'fit-content',
        position: 'sticky',
        top: '100px' // Щоб панель їздила за скролом
    },
    group: { marginBottom: '25px' },

    label: {
        display: 'block',
        color: '#d50000',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        marginBottom: '10px',
        letterSpacing: '1.5px',
        fontFamily: "'Orbitron', sans-serif"
    },

    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #333',
        backgroundColor: '#1a1a1a', // Темний фон поля
        color: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        fontSize: '0.9rem',
        transition: 'border-color 0.2s'
    },

    selectWrapper: {
        position: 'relative',
        width: '100%'
    },

    select: {
        width: '100%',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #333',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        outline: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        appearance: 'none', // Прибираємо стандартну стрілку
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23d50000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px top 50%',
        backgroundSize: '12px auto',
    },

    option: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '10px'
    },

    resetBtn: {
        width: '100%',
        padding: '10px',
        background: 'transparent',
        border: '1px solid #444',
        color: '#888',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        transition: 'all 0.2s'
    }
};

export default FilterBar;