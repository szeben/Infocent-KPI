import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  TrendingUp, 
  Folder, 
  Plus, 
  Trash2, 
  X, 
  Info, 
  Layers, 
  Award, 
  AlertCircle, 
  Database,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity
} from 'lucide-react';

// Sub-component: Circular Progress Ring
function CircularProgress({ percent, size = 60, strokeWidth = 5, color = '#6366f1' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percent, 100) / 100) * circumference;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="circular-progress" style={{ overflow: 'visible' }}>
      <circle
        stroke="rgba(255, 255, 255, 0.04)"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
          transition: 'stroke-dashoffset 0.5s ease-in-out',
        }}
      />
      <text
        x="50%"
        y="50%"
        dy="4px"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="11px"
        fontWeight="800"
      >
        {percent}%
      </text>
    </svg>
  );
}

export default function App() {
  // State variables
  const [units, setUnits] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Navigation & Selection
  const [activeTab, setActiveTab] = useState('all'); // 'all' or unit.id
  const [selectedKpiId, setSelectedKpiId] = useState(null);
  
  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [modalKpi, setModalKpi] = useState(null);
  const [formValue, setFormValue] = useState('');
  const [formPeriodStart, setFormPeriodStart] = useState('');
  const [formPeriodEnd, setFormPeriodEnd] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Units
      const { data: unitsData, error: unitsErr } = await supabase
        .from('units')
        .select('*')
        .order('name');
      if (unitsErr) throw unitsErr;
      setUnits(unitsData);

      // 2. Fetch KPIs
      const { data: kpisData, error: kpisErr } = await supabase
        .from('kpis')
        .select('*')
        .order('name');
      if (kpisErr) throw kpisErr;
      setKpis(kpisData);

      // 3. Fetch KPI Entries
      const { data: entriesData, error: entriesErr } = await supabase
        .from('kpi_entries')
        .select('*')
        .order('period_end', { ascending: true }); // chronological order
      if (entriesErr) throw entriesErr;
      setEntries(entriesData);

      // Automatically select the first KPI if available
      if (kpisData && kpisData.length > 0 && !selectedKpiId) {
        setSelectedKpiId(kpisData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg(`No se pudieron cargar los datos de Supabase: ${err.message || err.details || JSON.stringify(err)}. Por favor, verifica tu conexión y configuración de base de datos.`);
    } finally {
      setLoading(false);
    }
  }

  // Helpers
  function getKpiEntries(kpiId) {
    return entries.filter(e => e.kpi_id === kpiId);
  }

  function getLatestValue(kpiId) {
    const kpiEntries = getKpiEntries(kpiId);
    if (kpiEntries.length === 0) return null;
    return kpiEntries[kpiEntries.length - 1].value;
  }

  function getPreviousValue(kpiId) {
    const kpiEntries = getKpiEntries(kpiId);
    if (kpiEntries.length < 2) return null;
    return kpiEntries[kpiEntries.length - 2].value;
  }

  function getUnitColorClass(unitName) {
    if (!unitName) return '';
    const name = unitName.toLowerCase();
    if (name.includes('requerimiento')) return 'req';
    if (name.includes('desarrollo')) return 'dev';
    if (name.includes('calidad')) return 'qa';
    return '';
  }

  function checkIsLowerBetter(kpiName) {
    if (!kpiName) return false;
    const name = kpiName.toLowerCase();
    return name.includes('tiempo') || name.includes('densidad') || name.includes('tasa de cambio') || name.includes('defecto') || name.includes('error');
  }

  function calculateFulfillment(kpi, value) {
    if (value === null || value === undefined) return 0;
    const target = kpi.target_value;
    if (target === 0) return 100;
    
    const isLowerBetter = checkIsLowerBetter(kpi.name);
    
    if (isLowerBetter) {
      if (value <= target) return 100;
      return Math.max(0, Math.round((target / value) * 100));
    } else {
      return Math.min(150, Math.round((value / target) * 100)); // Cap at 150%
    }
  }

  function getFulfillmentColor(fulfillment) {
    if (fulfillment >= 100) return '#34d399'; // Green (Success)
    if (fulfillment >= 85) return '#fbbf24';  // Amber/Yellow (Warning)
    return '#ef4444';                         // Red (Alert)
  }

  function getUnitColorHex(unitName) {
    const colorClass = getUnitColorClass(unitName);
    if (colorClass === 'req') return '#c084fc';
    if (colorClass === 'dev') return '#2dd4bf';
    if (colorClass === 'qa') return '#34d399';
    return '#6366f1';
  }

  // Calculate Unit Average Fulfillment
  function getUnitAverageFulfillment(unitId) {
    const unitKpis = kpis.filter(k => k.unit_id === unitId);
    if (unitKpis.length === 0) return 0;
    
    let totalFulfillment = 0;
    let countedKpis = 0;
    
    unitKpis.forEach(kpi => {
      const val = getLatestValue(kpi.id);
      if (val !== null) {
        totalFulfillment += calculateFulfillment(kpi, val);
        countedKpis++;
      }
    });
    
    return countedKpis > 0 ? Math.round(totalFulfillment / countedKpis) : 0;
  }

  // Overall system average
  function getOverallAverageFulfillment() {
    if (kpis.length === 0) return 0;
    let totalFulfillment = 0;
    let countedKpis = 0;
    
    kpis.forEach(kpi => {
      const val = getLatestValue(kpi.id);
      if (val !== null) {
        totalFulfillment += calculateFulfillment(kpi, val);
        countedKpis++;
      }
    });
    
    return countedKpis > 0 ? Math.round(totalFulfillment / countedKpis) : 0;
  }

  // Statistics counters for overview
  function getOverviewStats() {
    let total = kpis.length;
    let success = 0;
    let warning = 0;
    let alert = 0;
    let activeCount = 0;

    kpis.forEach(kpi => {
      const val = getLatestValue(kpi.id);
      if (val !== null) {
        activeCount++;
        const fulfillment = calculateFulfillment(kpi, val);
        if (fulfillment >= 100) success++;
        else if (fulfillment >= 85) warning++;
        else alert++;
      }
    });

    return { total, success, warning, alert, inactive: total - activeCount };
  }

  // Render Trend Indicator Arrow
  function renderTrendIndicator(kpi) {
    const latest = getLatestValue(kpi.id);
    const prev = getPreviousValue(kpi.id);
    
    if (latest === null || prev === null) return null;
    if (latest === prev) {
      return (
        <span style={{ color: 'var(--text-muted)', fontSize: '15px' }} title="Sin cambios respecto al periodo anterior">
          →
        </span>
      );
    }
    
    const isLowerBetter = checkIsLowerBetter(kpi.name);
    const isIncrease = latest > prev;
    const isPositive = isLowerBetter ? !isIncrease : isIncrease;
    
    return (
      <span 
        style={{ 
          color: isPositive ? '#34d399' : '#ef4444', 
          fontWeight: '800',
          fontSize: '15px',
          marginLeft: '4px',
          display: 'inline-block'
        }} 
        title={isPositive ? `Mejoró (Ant: ${prev} → Act: ${latest})` : `Empeoró (Ant: ${prev} → Act: ${latest})`}
      >
        {isIncrease ? '↗' : '↘'}
      </span>
    );
  }

  // Form submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formValue || !formPeriodStart || !formPeriodEnd) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('kpi_entries')
        .insert([
          {
            kpi_id: modalKpi.id,
            value: parseFloat(formValue),
            period_start: formPeriodStart,
            period_end: formPeriodEnd,
            notes: formNotes || null
          }
        ]);

      if (error) throw error;

      // Close modal & reset form
      setShowModal(false);
      setFormValue('');
      setFormPeriodStart('');
      setFormPeriodEnd('');
      setFormNotes('');
      
      // Refresh Data
      await fetchData();
    } catch (err) {
      console.error('Error inserting KPI record:', err);
      alert('Error al registrar el KPI: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Delete handler
  async function handleDeleteEntry(entryId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro histórico?')) return;
    try {
      const { error } = await supabase
        .from('kpi_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      
      // Refresh Data
      await fetchData();
    } catch (err) {
      console.error('Error deleting KPI record:', err);
      alert('Error al eliminar el registro: ' + err.message);
    }
  }

  // Open modal helper
  function openAddModal(kpi) {
    setModalKpi(kpi);
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setFormPeriodStart(firstDay.toISOString().split('T')[0]);
    setFormPeriodEnd(today.toISOString().split('T')[0]);
    setFormValue('');
    setFormNotes('');
    setShowModal(true);
  }

  // Render SVG Line Chart
  function renderSVGChart(kpi) {
    const kpiEntries = getKpiEntries(kpi.id);
    if (kpiEntries.length === 0) {
      return (
        <div className="empty-state">
          <TrendingUp className="empty-icon" />
          <p>No hay datos registrados aún para este KPI.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => openAddModal(kpi)}>
            <Plus size={16} /> Registrar Primer Valor
          </button>
        </div>
      );
    }

    const width = 600;
    const height = 240;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = kpiEntries.map(e => e.value);
    const target = kpi.target_value;
    const allValues = [...values, target];
    
    const maxVal = Math.max(...allValues);
    const roundedMax = Math.ceil(maxVal * 1.15); // 15% headroom

    const pointsCount = kpiEntries.length;
    
    const getX = (index) => {
      if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    };

    const getY = (val) => {
      const ratio = val / roundedMax;
      return height - paddingBottom - ratio * chartHeight;
    };

    let pathD = '';
    let areaD = '';
    
    kpiEntries.forEach((entry, idx) => {
      const x = getX(idx);
      const y = getY(entry.value);
      if (idx === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${height - paddingBottom} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
    });

    if (pointsCount > 0) {
      const lastX = getX(pointsCount - 1);
      areaD += ` L ${lastX} ${height - paddingBottom} Z`;
    }

    const targetY = getY(target);
    const unitColor = getKpiEntriesColor(kpi);

    return (
      <div className="chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          <defs>
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={unitColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={unitColor} stopOpacity="0.00" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={unitColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const gridVal = roundedMax * r;
            const y = getY(gridVal);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="chart-axis-text">
                  {gridVal.toLocaleString()}
                </text>
              </g>
            );
          })}

          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} className="chart-axis-line" />

          {pointsCount > 1 && (
            <path d={areaD} fill="url(#chartAreaGradient)" />
          )}

          {/* Target line */}
          <line 
            x1={paddingLeft} 
            y1={targetY} 
            x2={width - paddingRight} 
            y2={targetY} 
            className="chart-target-line" 
          />
          <text x={width - paddingRight} y={targetY - 6} textAnchor="end" className="chart-axis-text" fill="#f59e0b" fontWeight="700">
            Meta: {target}
          </text>

          {pointsCount > 1 && (
            <path d={pathD} fill="none" stroke={unitColor} className="chart-line" filter="url(#glow)" />
          )}

          {/* Data Points */}
          {kpiEntries.map((entry, idx) => {
            const x = getX(idx);
            const y = getY(entry.value);
            return (
              <g key={entry.id}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r={5} 
                  className="chart-point" 
                  stroke={unitColor} 
                />
                <text 
                  x={x} 
                  y={y - 10} 
                  textAnchor="middle" 
                  className="chart-axis-text" 
                  fontWeight="700" 
                  fill="#ffffff"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                >
                  {entry.value}
                </text>
              </g>
            );
          })}

          {/* Date labels */}
          {kpiEntries.map((entry, idx) => {
            const x = getX(idx);
            const date = new Date(entry.period_end);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            return (
              <text 
                key={entry.id} 
                x={x} 
                y={height - paddingBottom + 18} 
                textAnchor="middle" 
                className="chart-axis-text"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }

  function getKpiEntriesColor(kpi) {
    const kpiUnit = units.find(u => u.id === kpi.unit_id);
    return getUnitColorHex(kpiUnit?.name);
  }

  // Filters
  const filteredKpis = activeTab === 'all' 
    ? kpis 
    : kpis.filter(k => k.unit_id === activeTab);

  const selectedKpi = kpis.find(k => k.id === selectedKpiId);
  const selectedKpiUnit = selectedKpi ? units.find(u => u.id === selectedKpi.unit_id) : null;
  const selectedKpiEntries = selectedKpi ? getKpiEntries(selectedKpi.id) : [];

  const stats = getOverviewStats();

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="logo-icon">
              <Activity size={22} />
            </div>
            <div className="logo-text">
              <h1>Infocent-KPI</h1>
              <p>Métricas de Ingeniería</p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-label">Conexión</div>
              <div className="stat-value" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}></span>
                Supabase Conectado
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Cumplimiento Global</div>
              <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                {getOverallAverageFulfillment()}%
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container">
        
        {/* Banner */}
        <section className="glass-panel hero-banner">
          <h2 className="hero-title">Dashboard de KPIs de Ingeniería</h2>
          <p className="hero-subtitle">
            Monitorea el avance, calidad y frecuencia de entregas de los equipos de Requerimientos, Desarrollo y Aseguramiento de Calidad.
          </p>
        </section>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Cargando datos del proyecto...</p>
          </div>
        ) : errorMsg ? (
          <div className="glass-panel empty-state" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle className="empty-icon" style={{ color: '#ef4444' }} />
            <h3>Ocurrió un error</h3>
            <p>{errorMsg}</p>
            <button className="btn btn-primary" onClick={fetchData}>Reintentar Conexión</button>
          </div>
        ) : (
          <div>
            {/* Tab Navigation */}
            <nav className="tabs-nav">
              <button 
                className={`tab-btn tab-all ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Layers size={16} /> Resumen General
              </button>
              {units.map(unit => {
                const colorClass = getUnitColorClass(unit.name);
                const isSelected = activeTab === unit.id;
                const fulfillment = getUnitAverageFulfillment(unit.id);
                return (
                  <button 
                    key={unit.id}
                    className={`tab-btn tab-${colorClass} ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveTab(unit.id)}
                  >
                    <Folder size={16} />
                    {unit.name} ({fulfillment}%)
                  </button>
                );
              })}
            </nav>

            {/* Layout switch: Resumen General vs. Unit Tabs */}
            {activeTab === 'all' ? (
              /* Executive Overview Panel (Fase 3 Feature) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <div className="stat-label" style={{ textAlign: 'left' }}>Total Indicadores</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{stats.total}</div>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div className="stat-label" style={{ textAlign: 'left' }}>En Meta (Favorable)</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#34d399' }}>{stats.success}</div>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <div className="stat-label" style={{ textAlign: 'left' }}>Advertencia</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#fbbf24' }}>{stats.warning}</div>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      <XCircle size={24} />
                    </div>
                    <div>
                      <div className="stat-label" style={{ textAlign: 'left' }}>En Alerta Crítica</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#ef4444' }}>{stats.alert}</div>
                    </div>
                  </div>
                </div>

                {/* Units comparison & radial gauges */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} style={{ color: 'var(--color-primary)' }} />
                    Cumplimiento Promedio por Unidad de Negocio
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {units.map(unit => {
                      const fulfillment = getUnitAverageFulfillment(unit.id);
                      const colorHex = getUnitColorHex(unit.name);
                      const unitKpis = kpis.filter(k => k.unit_id === unit.id);
                      
                      return (
                        <div key={unit.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                          <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{unit.name}</h4>
                          <CircularProgress percent={fulfillment} size={100} strokeWidth={8} color={colorHex} />
                          
                          <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                              Detalle de Indicadores ({unitKpis.length})
                            </div>
                            {unitKpis.map(kpi => {
                              const val = getLatestValue(kpi.id);
                              const kpiFulfillment = calculateFulfillment(kpi, val);
                              const statusColor = val !== null ? getFulfillmentColor(kpiFulfillment) : 'var(--text-muted)';
                              
                              return (
                                <div 
                                  key={kpi.id} 
                                  style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}
                                  onClick={() => {
                                    setSelectedKpiId(kpi.id);
                                    setActiveTab(unit.id); // switch tab to unit for detail view
                                  }}
                                >
                                  <span style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{kpi.name}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: '700', color: statusColor }}>
                                      {val !== null ? `${val} (${kpiFulfillment}%)` : 'Sin datos'}
                                    </span>
                                    {renderTrendIndicator(kpi)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compare chart */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Comparación Directa de Cumplimiento</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    {units.map(unit => {
                      const fulfillment = getUnitAverageFulfillment(unit.id);
                      const colorHex = getUnitColorHex(unit.name);
                      
                      return (
                        <div key={unit.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ fontWeight: '600' }}>{unit.name}</span>
                            <span style={{ fontWeight: '700', color: colorHex }}>{fulfillment}% cumplido</span>
                          </div>
                          <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${fulfillment}%`, 
                                background: `linear-gradient(to right, #6366f1, ${colorHex})`,
                                borderRadius: '6px',
                                boxShadow: `0 0 10px ${colorHex}50`
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              /* Normal Tab Grid Layout (Filtered by Unit) */
              <div className="dashboard-grid">
                
                {/* Left Panel: KPI Cards */}
                <div>
                  <div className="kpi-grid">
                    {filteredKpis.map(kpi => {
                      const unit = units.find(u => u.id === kpi.unit_id);
                      const colorClass = getUnitColorClass(unit?.name);
                      const latestVal = getLatestValue(kpi.id);
                      const fulfillment = calculateFulfillment(kpi, latestVal);
                      const isSelected = selectedKpiId === kpi.id;
                      const isPercentage = kpi.unit_of_measure === 'Porcentaje';
                      const statusColor = latestVal !== null ? getFulfillmentColor(fulfillment) : 'var(--text-muted)';

                      return (
                        <article 
                          key={kpi.id}
                          className={`glass-panel kpi-card ${colorClass} ${isSelected ? 'active-kpi' : ''}`}
                          style={{
                            borderColor: isSelected ? getKpiEntriesColor(kpi) : 'var(--border-glass)',
                            boxShadow: isSelected ? `0 0 16px ${getKpiEntriesColor(kpi)}30` : ''
                          }}
                          onClick={() => setSelectedKpiId(kpi.id)}
                        >
                          <div>
                            <div className="kpi-card-header">
                              <div className="kpi-card-meta">
                                <span className="kpi-unit-tag">{unit?.name}</span>
                                <h3 className="kpi-name">{kpi.name}</h3>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                {kpi.frequency}
                              </span>
                            </div>
                            <p className="kpi-desc">{kpi.description}</p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            {/* Layout: Circular Ring for % or Value Block for others */}
                            {isPercentage && latestVal !== null ? (
                              <div className="kpi-indicator-ring">
                                <CircularProgress percent={fulfillment} size={60} strokeWidth={5} color={statusColor} />
                              </div>
                            ) : null}

                            <div style={{ flexGrow: 1 }}>
                              <div className="kpi-values-row" style={{ border: 'none', padding: '0', marginTop: '0' }}>
                                <div className="current-value-container">
                                  <span className="val-label">Estado Actual</span>
                                  <span className="val-num" style={{ color: statusColor, display: 'inline-flex', alignItems: 'center' }}>
                                    {latestVal !== null ? latestVal : '-'}
                                    <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '3px' }}>
                                      {kpi.unit_of_measure}
                                    </span>
                                    {renderTrendIndicator(kpi)}
                                  </span>
                                </div>

                                <div className="target-container">
                                  <span className="val-label">Meta</span>
                                  <div className="target-val">
                                    {kpi.target_value} {kpi.unit_of_measure}
                                  </div>
                                  <div style={{ fontSize: '11px', color: statusColor }}>
                                    {latestVal !== null ? `${fulfillment}% Meta` : 'Sin registros'}
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar (only for non-percentage or empty states to keep visual balance) */}
                              {!isPercentage || latestVal === null ? (
                                <div className="kpi-progress-bar-bg" style={{ marginTop: '8px' }}>
                                  <div 
                                    className="kpi-progress-bar-fill"
                                    style={{ 
                                      width: `${latestVal !== null ? Math.min(fulfillment, 100) : 0}%`,
                                      background: statusColor,
                                      boxShadow: `0 0 8px ${statusColor}40`
                                    }}
                                  ></div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: KPI Details, Charts, History Logs */}
                <aside>
                  {selectedKpi ? (
                    <div className="glass-panel kpi-detail-view" style={{ borderColor: `${getKpiEntriesColor(selectedKpi)}40` }}>
                      <div className="detail-header">
                        <div className="detail-title-section">
                          <span className="kpi-unit-tag" style={{ background: `${getKpiEntriesColor(selectedKpi)}15`, color: getKpiEntriesColor(selectedKpi) }}>
                            {selectedKpiUnit?.name}
                          </span>
                          <h2>{selectedKpi.name}</h2>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedKpi.description}</p>
                        </div>
                        <button 
                          className="btn btn-primary"
                          onClick={() => openAddModal(selectedKpi)}
                        >
                          <Plus size={16} /> Registrar
                        </button>
                      </div>

                      {/* SVG Chart */}
                      <div>
                        <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendingUp size={16} style={{ color: getKpiEntriesColor(selectedKpi) }} /> Historial de Avance
                        </h3>
                        {renderSVGChart(selectedKpi)}
                      </div>

                      {/* Historic List */}
                      <div className="history-section">
                        <div className="history-title">
                          <span>Registros Históricos</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {selectedKpiEntries.length} entradas
                          </span>
                        </div>

                        {selectedKpiEntries.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                            Registra el primer valor para visualizar el listado.
                          </p>
                        ) : (
                          <div className="history-list">
                            {[...selectedKpiEntries].reverse().map(entry => {
                              const date = new Date(entry.period_end);
                              const formattedDate = date.toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              });

                              return (
                                <div key={entry.id} className="history-item">
                                  <div className="history-item-left">
                                    <span className="history-date">{formattedDate}</span>
                                    {entry.notes && <span className="history-note">{entry.notes}</span>}
                                  </div>
                                  <div className="history-item-right">
                                    <span className="history-value" style={{ color: getKpiEntriesColor(selectedKpi) }}>
                                      {entry.value} {selectedKpi.unit_of_measure}
                                    </span>
                                    <button 
                                      className="history-delete-btn"
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      title="Eliminar registro"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel empty-state">
                      <Info className="empty-icon" />
                      <p>Selecciona un KPI del listado para ver su gráfico e historial de registros.</p>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Form */}
      {showModal && modalKpi && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ background: 'var(--bg-secondary)' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px' }}>Registrar KPI: {modalKpi.name}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Valor del KPI ({modalKpi.unit_of_measure}) *</label>
                  <input 
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    placeholder={`Ingresa el valor (meta: ${modalKpi.target_value})`}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Inicio del Periodo *</label>
                    <input 
                      type="date"
                      required
                      className="form-input"
                      value={formPeriodStart}
                      onChange={(e) => setFormPeriodStart(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fin del Periodo *</label>
                    <input 
                      type="date"
                      required
                      className="form-input"
                      value={formPeriodEnd}
                      onChange={(e) => setFormPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas / Observaciones</label>
                  <textarea 
                    className="form-input"
                    rows="3"
                    placeholder="Detalles sobre este registro..."
                    style={{ resize: 'none' }}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar Valor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Database size={14} /> Conectado a Supabase
          <span>•</span>
          <GitBranch size={14} /> Git Sync Activo
        </div>
        <div>
          &copy; {new Date().getFullYear()} Infocent-KPI. Todos los derechos reservados.
        </div>
      </footer>
    </>
  );
}
