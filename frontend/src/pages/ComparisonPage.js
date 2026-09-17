import React, { useState, useEffect } from 'react';
import { api, endpoints } from '../api/endpoints';
import NavigationBar from '../components/NavigationBar';
import { buttonStyles } from '../styles/buttonStyles';

const CATEGORIES = [
  { id: 'cpu', label: 'ПРОЦЕСОРИ', icon: '🧠' },
  { id: 'gpu', label: 'ВІДЕОКАРТИ', icon: '🎮' },
  { id: 'motherboard', label: 'МАТЕРИНСЬКІ ПЛАТИ', icon: '🔌' },
  { id: 'ram', label: 'ПАМʼЯТЬ', icon: '💾' },
  { id: 'psu', label: 'БЛОКИ ЖИВЛЕННЯ', icon: '⚡' },
];

const SPEC_CONFIG = {
  cpu: [
    { key: 'cores', label: 'Ядра', type: 'number', best: 'high' },
    { key: 'threads', label: 'Потоки', type: 'number', best: 'high' },
    { key: 'frequency', label: 'Частота', type: 'text' },
    { key: 'socket', label: 'Сокет', type: 'text' },
  ],
  gpu: [
    { key: 'vram', label: "Об'єм пам'яті", type: 'text' },
    { key: 'memory_type', label: 'Тип пам\'яті', type: 'text' },
    { key: 'bus', label: 'Шина', type: 'text' },
  ],
  motherboard: [
    { key: 'socket', label: 'Сокет', type: 'text' },
    { key: 'form_factor', label: 'Форм-фактор', type: 'text' },
    { key: 'ram_slots', label: 'Слоти RAM', type: 'number', best: 'high' },
  ],
  ram: [
    { key: 'capacity', label: "Об'єм", type: 'text' },
    { key: 'type', label: 'Тип', type: 'text' },
    { key: 'speed', label: 'Частота', type: 'text' },
  ],
  psu: [
    { key: 'power', label: 'Потужність', type: 'text' },
    { key: 'certification', label: 'Сертифікат', type: 'text' },
    { key: 'modular', label: 'Модульний', type: 'boolean' },
  ]
};

const ComparisonPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('cpu');
  const [components, setComponents] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComponents = async () => {
      setLoading(true);
      try {
        const response = await api.get(endpoints.components.getAll, {
          params: { category: selectedCategory }
        });
        const items = response.data || [];
        const sorted = items.sort((a, b) => (b.specs?.score || 0) - (a.specs?.score || 0));
        setComponents(sorted);
        setSelectedItems([]);
      } catch (error) {
        console.error('Error fetching components:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, [selectedCategory]);

  const toggleSelection = (item) => {
    const isSelected = selectedItems.some(i => i.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      if (selectedItems.length >= 4) {
        alert("Можна порівнювати максимум 4 деталі одночасно");
        return;
      }
      setSelectedItems([...selectedItems, item]);
    }
  };

  // === ВИПРАВЛЕННЯ: Додана відсутня функція ===
  const getMaxScore = () => {
    if (selectedItems.length === 0) return 100;
    return Math.max(...selectedItems.map(item => item.specs?.score || 0));
  };
  // ============================================

  const isBestValue = (currentItem, allItems, key, type, bestDirection) => {
    if (allItems.length < 2 || !bestDirection) return false;

    const val = currentItem.specs?.[key];
    if (val === undefined) return false;

    const parseNum = (v) => parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;

    const currentNum = parseNum(val);
    const allNums = allItems.map(i => parseNum(i.specs?.[key]));

    if (bestDirection === 'high') {
      return currentNum === Math.max(...allNums) && currentNum > 0;
    } else {
      return currentNum === Math.min(...allNums) && currentNum > 0;
    }
  };

  const isBestPrice = (currentItem, allItems) => {
    if (allItems.length < 2) return false;
    const currentPrice = parseFloat(currentItem.price);
    const minPrice = Math.min(...allItems.map(i => parseFloat(i.price)));
    return currentPrice === minPrice;
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
      <NavigationBar breadcrumbs={[{ label: 'Головна', link: '/' }, { label: 'ПОРІВНЯННЯ ДЕТАЛЕЙ' }]} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2.5rem', color: '#fff', letterSpacing: '4px' }}>
            COMPONENT <span style={{ color: '#d50000' }}>VS</span>
          </h1>
        </div>

        {/* ВИБІР КАТЕГОРІЇ */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                ...buttonStyles.secondary,
                padding: '10px 20px',
                background: selectedCategory === cat.id ? 'linear-gradient(45deg, #d50000, #b71c1c)' : 'rgba(255,255,255,0.05)',
                border: selectedCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.2)',
                color: selectedCategory === cat.id ? '#fff' : '#ccc',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* СПИСОК ДЕТАЛЕЙ */}
        {!loading && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '15px' }}>
              Виберіть деталі для порівняння (max 4):
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              {components.map(item => {
                const isSelected = selectedItems.some(i => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item)}
                    style={{
                      padding: '10px',
                      border: isSelected ? '1px solid #4caf50' : '1px solid #333',
                      background: isSelected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(20, 20, 20, 0.8)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ color: '#888', fontSize: '0.75rem' }}>${parseFloat(item.price).toFixed(0)} | Score: {item.specs?.score}</div>
                    </div>
                    {isSelected && <div style={{ color: '#4caf50' }}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ТАБЛИЦЯ ПОРІВНЯННЯ */}
        {selectedItems.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', color: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ padding: '15px', textAlign: 'left', background: '#111', borderBottom: '1px solid #333', minWidth: '150px' }}>
                    Характеристика
                  </th>
                  {selectedItems.map(item => (
                    <th key={item.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #333', minWidth: '200px', verticalAlign: 'top' }}>
                      <div style={{ height: '80px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={item.image_url} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#fff' }}>{item.name}</div>
                      <button
                        onClick={() => toggleSelection(item)}
                        style={{ marginTop: '10px', background: 'transparent', border: '1px solid #444', color: '#888', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        Прибрати
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ЦІНА */}
                <tr>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#aaa', borderBottom: '1px solid #222' }}>Ціна</td>
                  {selectedItems.map(item => {
                    const best = isBestPrice(item, selectedItems);
                    return (
                      <td key={item.id} style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #222', background: best ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: best ? '#4caf50' : '#fff' }}>
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* ПОТУЖНІСТЬ (SCORE) */}
                <tr>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#aaa', borderBottom: '1px solid #222' }}>Рейтинг (Score)</td>
                  {selectedItems.map(item => {
                    const score = item.specs?.score || 0;
                    const max = getMaxScore(); // ТЕПЕР ЦЯ ФУНКЦІЯ Є!
                    const percent = (score / max) * 100;
                    return (
                      <td key={item.id} style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #222' }}>
                        <div style={{ fontWeight: 'bold', color: score === max ? '#2196F3' : '#fff', marginBottom: '5px' }}>{score}</div>
                        <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: score === max ? '#2196F3' : '#666' }}></div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* ДИНАМІЧНІ ХАРАКТЕРИСТИКИ */}
                {SPEC_CONFIG[selectedCategory]?.map(spec => (
                  <tr key={spec.key}>
                    <td style={{ padding: '15px', color: '#888', borderBottom: '1px solid #222' }}>{spec.label}</td>
                    {selectedItems.map(item => {
                      const val = item.specs?.[spec.key] || '-';
                      const best = spec.best ? isBestValue(item, selectedItems, spec.key, spec.type, spec.best) : false;

                      let displayVal = val;
                      if (spec.type === 'boolean') displayVal = val ? 'Так' : 'Ні';

                      return (
                        <td key={item.id} style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #222', color: best ? '#4caf50' : '#fff', fontWeight: best ? 'bold' : 'normal' }}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666', border: '1px dashed #333', borderRadius: '8px', marginTop: '20px' }}>
            Виберіть 2 або більше товарів зі списку вище, щоб побачити детальне порівняння.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;