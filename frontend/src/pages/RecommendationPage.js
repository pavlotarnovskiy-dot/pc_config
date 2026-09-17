import React, { useState, useEffect } from 'react';
import { api, endpoints } from '../api/endpoints';
import FPSMeter from '../components/FPSMeter';
import NavigationBar from '../components/NavigationBar';
import { buttonStyles } from '../styles/buttonStyles';

const GAMES = [
  { id: 'cs2', name: 'CS 2', icon: '🔫', minGPUScore: 20, minCPUScore: 40, category: 'esports' },
  { id: 'valorant', name: 'VALORANT', icon: '⚔️', minGPUScore: 15, minCPUScore: 35, category: 'esports' },
  { id: 'dota2', name: 'Dota 2', icon: '🐉', minGPUScore: 25, minCPUScore: 40, category: 'strategy' },
  { id: 'gta5', name: 'GTA V', icon: '🚗', minGPUScore: 45, minCPUScore: 45, category: 'openworld' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', icon: '🤖', minGPUScore: 75, minCPUScore: 65, category: 'aaa' },
  { id: 'elden_ring', name: 'Elden Ring', icon: '💍', minGPUScore: 60, minCPUScore: 55, category: 'action' },
];

const BUDGET_RANGES = [
  { id: 'budget', name: '💰 ЕКОНОМ (до $500)', min: 0, max: 500 },
  { id: 'mid', name: '💵 СЕРЕДНІЙ ($500-$1000)', min: 500, max: 1000 },
  { id: 'high', name: '💴 ПРЕМІУМ ($1000-$2000)', min: 1000, max: 2000 },
  { id: 'ultra', name: '💸 УЛЬТРА ($2000+)', min: 2000, max: 5000 },
  { id: 'custom', name: '⚙️ КАСТОМНИЙ', min: 0, max: Infinity },
];

// Налаштування якості (повернули сюди)
const QUALITY_LEVELS = [
  { id: 'Low', label: 'Низькі', multiplier: 0.6, color: '#4caf50' },
  { id: 'Medium', label: 'Середні', multiplier: 0.8, color: '#2196f3' },
  { id: 'High', label: 'Високі', multiplier: 1.0, color: '#ff9800' },
  { id: 'Ultra', label: 'Ультра', multiplier: 1.3, color: '#d50000' },
];

const CATEGORIES = [
  { id: 'cpu', label: 'ПРОЦЕСОР', icon: '🧠' },
  { id: 'gpu', label: 'ВІДЕОКАРТА', icon: '🎮' },
  { id: 'motherboard', label: 'МАТЕРИНСЬКА ПЛАТА', icon: '🔌' },
  { id: 'ram', label: 'ПАМʼЯТЬ', icon: '💾' },
  { id: 'psu', label: 'БЛОК ЖИВЛЕННЯ', icon: '⚡' },
];

const RecommendationPage = () => {
  const [selectedGame, setSelectedGame] = useState('cs2');
  const [selectedBudget, setSelectedBudget] = useState('mid');
  const [customBudget, setCustomBudget] = useState(1000);

  // === ФІЛЬТРИ ===
  const [targetRes, setTargetRes] = useState('1080p');
  const [targetFPS, setTargetFPS] = useState(60);
  const [targetQuality, setTargetQuality] = useState('High'); // Стан якості тут

  const [recommendedBuild, setRecommendedBuild] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allComponents, setAllComponents] = useState({});

  useEffect(() => {
    const fetchAllComponents = async () => {
      try {
        const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'psu'];
        const components = {};
        for (const category of categories) {
          const response = await api.get(endpoints.components.getAll, { params: { category } });
          components[category] = response.data || [];
        }
        setAllComponents(components);
      } catch (error) {
        console.error('Error fetching components:', error);
      }
    };
    fetchAllComponents();
  }, []);

  useEffect(() => {
    if (Object.keys(allComponents).length > 0) {
      const timer = setTimeout(generateRecommendation, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame, selectedBudget, customBudget, targetRes, targetFPS, targetQuality, allComponents]);

  const generateRecommendation = () => {
    setLoading(true);
    try {
      const game = GAMES.find(g => g.id === selectedGame);
      const budgetRange = BUDGET_RANGES.find(b => b.id === selectedBudget);
      if (!game || !budgetRange) return;

      let actualBudget = selectedBudget === 'custom' ? customBudget : budgetRange.max;

      // 1. Розрахунок вимог з урахуванням якості
      const resMult = { '1080p': 1.0, '1440p': 1.4, '4K': 2.2 };
      const fpsMultGPU = { 60: 1.0, 120: 1.3, 144: 1.5 };
      const fpsMultCPU = { 60: 1.0, 120: 1.4, 144: 1.6 };
      const qualMult = QUALITY_LEVELS.find(q => q.id === targetQuality)?.multiplier || 1.0;

      const reqGPUScore = Math.ceil(game.minGPUScore * resMult[targetRes] * fpsMultGPU[targetFPS] * qualMult);
      const reqCPUScore = Math.ceil(game.minCPUScore * fpsMultCPU[targetFPS]);

      // 2. Розподіл бюджету
      let cpuPct = 0.22, gpuPct = 0.38, moboPct = 0.13, ramPct = 0.12, psuPct = 0.15;

      if (actualBudget <= 700) {
        moboPct = 0.12; ramPct = 0.10; psuPct = 0.12;
        const left = 1 - (moboPct + ramPct + psuPct);
        cpuPct = left * 0.4; gpuPct = left * 0.6;
      }

      if (targetRes === '4K' || targetQuality === 'Ultra') {
        gpuPct += 0.08; cpuPct -= 0.08;
      }

      const budgetAlloc = {
        cpu: actualBudget * cpuPct,
        gpu: actualBudget * gpuPct,
        motherboard: actualBudget * moboPct,
        ram: actualBudget * ramPct,
        psu: actualBudget * psuPct
      };

      // 3. Підбір (Fallback логіка)
      const findBest = (category, targetPrice, minScore, filterFn = () => true) => {
        const items = allComponents[category] || [];
        const maxPrice = targetPrice * 1.15;

        // Спроба 1: Ідеальний збіг
        let candidates = items.filter(item => {
          const price = parseFloat(item.price) || 0;
          const score = item.specs?.score || 0;
          return price <= maxPrice && score >= minScore && filterFn(item);
        });

        // Спроба 2: Просто в бюджет
        if (candidates.length === 0) {
          candidates = items.filter(item => {
            const price = parseFloat(item.price) || 0;
            return price <= maxPrice && filterFn(item);
          });
        }

        return candidates.sort((a, b) => (b.specs?.score || 0) - (a.specs?.score || 0))[0] || null;
      };

      const cpu = findBest('cpu', budgetAlloc.cpu, reqCPUScore);
      const gpu = findBest('gpu', budgetAlloc.gpu, reqGPUScore);
      const requiredSocket = cpu?.specs?.socket;
      const motherboard = findBest('motherboard', budgetAlloc.motherboard, 0, (item) => !requiredSocket || item.specs?.socket === requiredSocket);

      const ramFilterFn = (item) => {
        if (!motherboard) return true;
        const itemType = (item.specs?.type || item.name || '').toUpperCase();
        const moboType = (motherboard.specs?.memory_type || motherboard.name || '').toUpperCase();
        if (!itemType || !moboType) return true;

        const itemIsDDR4 = itemType.includes('DDR4');
        const itemIsDDR5 = itemType.includes('DDR5');
        const moboIsDDR4 = moboType.includes('DDR4');
        const moboIsDDR5 = moboType.includes('DDR5');

        const moboSocket = (motherboard.specs?.socket || '').toUpperCase();
        if (moboSocket === 'AM5' && itemIsDDR4) return false;

        if ((itemIsDDR4 || itemIsDDR5) && (moboIsDDR4 || moboIsDDR5)) {
          return (itemIsDDR4 === moboIsDDR4) || (itemIsDDR5 === moboIsDDR5);
        }
        return true;
      };

      const ram = findBest('ram', budgetAlloc.ram, 0, ramFilterFn);
      const psu = findBest('psu', budgetAlloc.psu, 0);

      setRecommendedBuild({
        components: { cpu, gpu, motherboard, ram, psu },
        game
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = () => {
    if (!recommendedBuild) return 0;
    return Object.values(recommendedBuild.components).reduce((sum, c) => sum + (parseFloat(c?.price) || 0), 0);
  };

  const getLimit = () => selectedBudget === 'custom' ? customBudget : BUDGET_RANGES.find(b => b.id === selectedBudget)?.max;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
      <NavigationBar breadcrumbs={[{ label: 'Головна', link: '/' }, { label: 'ПІДБІР ПК' }]} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '3rem', color: '#fff', letterSpacing: '4px', fontWeight: '900' }}>
            GAME <span style={{ color: '#d50000' }}>MATCHER</span>
          </h1>
          <p style={{ color: '#888', letterSpacing: '2px', fontSize: '0.9rem' }}>
            Вкажи, як хочеш грати, і ми підберемо залізо
          </p>
        </div>

        {/* 1. ГРА */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>1️⃣ Обери гру:</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            {GAMES.map(game => (
              <button key={game.id} onClick={() => setSelectedGame(game.id)}
                style={{
                  ...buttonStyles.secondary, padding: '15px', flexDirection: 'column', gap: '8px',
                  background: selectedGame === game.id ? 'linear-gradient(45deg, #d50000, #b71c1c)' : 'transparent',
                  border: selectedGame === game.id ? 'none' : '1px solid rgba(255,255,255,0.3)', color: selectedGame === game.id ? '#fff' : '#e0e0e0'
                }}>
                <span style={{ fontSize: '1.8rem' }}>{game.icon}</span>
                <span style={{ fontWeight: 'bold' }}>{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. БЮДЖЕТ */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>2️⃣ Обери бюджет:</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {BUDGET_RANGES.map(b => (
              <button key={b.id} onClick={() => setSelectedBudget(b.id)}
                style={{
                  ...buttonStyles.secondary, padding: '15px', fontWeight: 'bold', fontSize: '0.95rem',
                  background: selectedBudget === b.id ? 'linear-gradient(45deg, #4caf50, #45a049)' : 'transparent',
                  border: selectedBudget === b.id ? 'none' : '1px solid rgba(255,255,255,0.3)', color: selectedBudget === b.id ? '#fff' : '#e0e0e0'
                }}>
                {b.name}
              </button>
            ))}
          </div>
          {selectedBudget === 'custom' && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '6px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <label style={{ color: '#aaa', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>💰 Ліміт: <strong style={{ color: '#4caf50' }}>${customBudget}</strong></label>
              <input type="range" min="200" max="5000" value={customBudget} onChange={(e) => setCustomBudget(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#4caf50' }} />
            </div>
          )}
        </div>

        {/* 3. НАЛАШТУВАННЯ (ФІЛЬТРИ) - ТУТ Є ЯКІСТЬ */}
        <div style={{ marginBottom: '40px', padding: '25px', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>3️⃣ Налаштування графіки (Впливають на пошук):</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>

            {/* ЯКІСТЬ - ТУТ ВОНА МАЄ БУТИ */}
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>🎨 Якість графіки:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {QUALITY_LEVELS.map(q => (
                  <button key={q.id} onClick={() => setTargetQuality(q.id)}
                    style={{
                      padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s',
                      background: targetQuality === q.id ? q.color : 'rgba(255,255,255,0.05)',
                      border: targetQuality === q.id ? 'none' : '1px solid rgba(255,255,255,0.2)', color: targetQuality === q.id ? '#fff' : '#ccc'
                    }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* РОЗДІЛЕННЯ */}
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>🖥️ Роздільна здатність:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['1080p', '1440p', '4K'].map(res => (
                  <button key={res} onClick={() => setTargetRes(res)}
                    style={{
                      padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s',
                      background: targetRes === res ? '#2196F3' : 'rgba(255,255,255,0.05)',
                      border: targetRes === res ? 'none' : '1px solid rgba(255,255,255,0.2)', color: targetRes === res ? '#fff' : '#ccc'
                    }}>
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* FPS */}
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>⚡ Цільовий FPS:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[60, 120, 144].map(fps => (
                  <button key={fps} onClick={() => setTargetFPS(fps)}
                    style={{
                      padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s',
                      background: targetFPS === fps ? '#FF9800' : 'rgba(255,255,255,0.05)',
                      border: targetFPS === fps ? 'none' : '1px solid rgba(255,255,255,0.2)', color: targetFPS === fps ? '#fff' : '#ccc'
                    }}>
                    {fps}+
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #222', paddingTop: '10px' }}>
            💡 Алгоритм шукатиме компоненти, що забезпечать <strong>{targetFPS} FPS</strong> на <strong>{targetQuality}</strong> налаштуваннях в <strong>{targetRes}</strong>.
          </div>
        </div>

        {/* 4. РЕЗУЛЬТАТ */}
        {recommendedBuild && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>4️⃣ Ваша збірка:</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {CATEGORIES.map(cat => {
                const item = recommendedBuild.components[cat.id];
                return (
                  <div key={cat.id} style={{ background: 'rgba(0, 0, 0, 0.5)', border: item ? '1px solid #333' : '1px solid #d50000', borderRadius: '6px', padding: '15px' }}>
                    <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>{cat.label}</div>
                    {item ? (
                      <>
                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>{item.name}</div>
                        <div style={{ color: '#4caf50', fontSize: '0.9rem' }}>${parseFloat(item.price).toFixed(2)}</div>
                      </>
                    ) : (
                      <div style={{ color: '#d50000', fontSize: '0.8rem' }}>❌ Заслабка для цих вимог або бюджету</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#111', padding: '20px', borderRadius: '6px', border: '1px solid #333', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>ВАРТІСТЬ</div>
                <div style={{ fontSize: '2rem', color: '#fff', fontWeight: 'bold' }}>${getTotalPrice().toFixed(2)}</div>
              </div>
              {(() => {
                const limit = getLimit();
                const diff = limit - getTotalPrice();
                const isFail = diff < 0;
                return (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: isFail ? '#ff5252' : '#4caf50', fontWeight: 'bold' }}>{isFail ? 'ПЕРЕВИТРАТА' : 'В МЕЖАХ БЮДЖЕТУ'}</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Ліміт: ${limit}</div>
                  </div>
                )
              })()}
            </div>

            {/* FPS METER - Передаємо обрані параметри, щоб він їх ВІДОБРАЗИВ, а не питав знову */}
            <FPSMeter
              cpu={recommendedBuild.components.cpu}
              gpu={recommendedBuild.components.gpu}
              selectedGameId={selectedGame}
              targetFPS={targetFPS}
              quality={targetQuality}
              resolution={targetRes}
            />
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>⚙️ Підбір конфігурації...</div>}
      </div>
    </div>
  );
};

export default RecommendationPage;