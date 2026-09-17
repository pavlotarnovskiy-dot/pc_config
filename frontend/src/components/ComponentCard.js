import React from 'react';

const ComponentCard = ({ item, onSelect, isSelected }) => {

    const renderSpecs = (specs) => {
        if (!specs) return null;
        return Object.entries(specs).slice(0, 3).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#666', textTransform: 'uppercase' }}>{key.replace('_', ' ')}</span>
                <span style={{ color: '#ccc' }}>{value}</span>
            </div>
        ));
    };

    return (
        <div
            className="glass-panel product-card hover-card"
            style={{
                borderRadius: '4px',
                padding: '15px',
                position: 'relative',
                // Логіка кольорів: якщо обрано - зелений, інакше - прозорий
                border: isSelected ? '1px solid #00e676' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(0, 230, 118, 0.05)' : 'rgba(20, 20, 20, 0.6)',

                // ПРИБРАЛИ opacity: 0, щоб картки були видимі відразу!
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Картинка */}
            <div style={{
                height: '140px',
                background: '#fff',
                borderRadius: '2px',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {isSelected && (
                    <div style={{
                        position: 'absolute', top: '5px', right: '5px',
                        background: '#00e676', color: '#000',
                        fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '2px',
                        zIndex: 2
                    }}>
                        INSTALLED
                    </div>
                )}

                <img
                    src={item.image_url || 'https://placehold.co/400x300/222/d50000?text=NO+IMAGE'}
                    alt={item.name}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300/222/d50000?text=NO+IMAGE';
                    }}
                />
            </div>

            <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '1rem',
                color: '#fff',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: '0.5px',
                height: '40px',
                overflow: 'hidden'
            }}>
                {item.name}
            </h4>

            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                {renderSpecs(item.specs)}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: '1.2rem', fontWeight: 'bold', color: '#ff1744' }}>
                    {item.price} $
                </div>

                <button
                    onClick={() => onSelect(item)}
                    style={{
                        padding: '8px 16px',
                        background: isSelected ? 'transparent' : '#d50000',
                        border: isSelected ? '1px solid #00e676' : 'none',
                        color: isSelected ? '#00e676' : 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? 'none' : '0 0 10px rgba(213,0,0,0.3)'
                    }}
                >
                    {isSelected ? 'REMOVE' : 'SELECT'}
                </button>
            </div>
        </div>
    );
};

export default ComponentCard;