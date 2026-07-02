import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  TrendingUp, 
  Folder, 
  Calendar, 
  Plus, 
  Trash2, 
  X, 
  Info, 
  Layers, 
  Award, 
  AlertCircle, 
  Database,
  GitBranch
} from 'lucide-react';

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
        .order('period_end', { ascending: true }); // chronological order for charts
      if (entriesErr) throw entriesErr;
      setEntries(entriesData);

      // Automatically select the first KPI if available
      if (kpisData && kpisData.length > 0 && !selectedKpiId) {
        setSelectedKpiId(kpisData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg('No se pudieron cargar los datos de Supabase. Por favor, verifica tu conexión y configuración de base de datos.');
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
    // Entries are sorted by period_end ascending, so the last is the latest
    return kpiEntries[kpiEntries.length - 1].value;
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
      return Math.min(150, Math.round((value / target) * 100)); // Cap fulfillment visual progress at 150%
    }
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

  // Form submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formValue || !formPeriodStart || !formPeriodEnd) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('kpi_entries')
        .insert([
          {
            kpi_id: modalKpi.id,
            value: parseFloat(formValue),
            period_start: formPeriodStart,
            period_end: formPeriodEnd,
            notes: formNotes || null
          }
        ])
        .select();

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
    // Preset period values (start of current month, end of current month)
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

    // Get value range
    const values = kpiEntries.map(e => e.value);
    const target = kpi.target_value;
    const allValues = [...values, target];
    
    const maxVal = Math.max(...allValues);
    const minVal = 0; // standard baseline is 0
    const valRange = maxVal - minVal || 1;
    const roundedMax = Math.ceil(maxVal * 1.15); // Add 15% head room

    // X coordinates: index to pixel
    const pointsCount = kpiEntries.length;
    
    const getX = (index) => {
      if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    };

    // Y coordinates: value to pixel
    const getY = (val) => {
      const ratio = val / roundedMax;
      return height - paddingBottom - ratio * chartHeight;
    };

    // Generate path for the line
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

          {/* Grid lines & Y Axis values */}
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

          {/* Baseline X-axis */}
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} className="chart-axis-line" />

          {/* Area under the line */}
          {pointsCount > 1 && (
            <path d={areaD} fill="url(#chartAreaGradient)" />
          )}

          {/* Target Line */}
          <line 
            x1={paddingLeft} 
            y1={targetY} 
            x2={width - paddingRight} 
            y2={targetY} 
            className="chart-target-line" 
          />
          <text x={width - paddingRight} y={targetY - 6} textAnchor="end" className="chart-axis-text" fill="#f59e0b" fontWeight="600">
            Meta: {target}
          </text>

          {/* Line Chart */}
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
                  fill={unitColor}
                >
                  {entry.value}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels (Dates) */}
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
    const unitClass = getUnitColorClass(kpiUnit?.name);
    if (unitClass === 'req') return '#c084fc';
    if (unitClass === 'dev') return '#2dd4bf';
    if (unitClass === 'qa') return '#34d399';
    return '#6366f1';
  }

  // Filters
  const filteredKpis = activeTab === 'all' 
    ? kpis 
    : kpis.filter(k => k.unit_id === activeTab);

  const selectedKpi = kpis.find(k => k.id === selectedKpiId);
  const selectedKpiUnit = selectedKpi ? units.find(u => u.id === selectedKpi.unit_id) : null;
  const selectedKpiEntries = selectedKpi ? getKpiEntries(selectedKpi.id) : [];

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="logo-icon">
              <Layers size={22} />
            </div>
            <div className="logo-text">
              <h1>Infocent-KPI</h1>
              <p>Control de Métricas</p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-label">Conexión</div>
              <div className="stat-value" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}></span>
                Supabase Online
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Cumplimiento Global</div>
              <div className="stat-value" style={{ color: '#6366f1' }}>
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
          <div className="dashboard-grid">
            
            {/* Left Panel: Units and KPI Cards */}
            <div>
              {/* Tab Navigation */}
              <nav className="tabs-nav">
                <button 
                  className={`tab-btn tab-all ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  <Layers size={16} /> Todo
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

              {/* KPI Cards Grid */}
              <div className="kpi-grid">
                {filteredKpis.map(kpi => {
                  const unit = units.find(u => u.id === kpi.unit_id);
                  const colorClass = getUnitColorClass(unit?.name);
                  const latestVal = getLatestValue(kpi.id);
                  const fulfillment = calculateFulfillment(kpi, latestVal);
                  const isSelected = selectedKpiId === kpi.id;

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

                      <div>
                        <div className="kpi-values-row">
                          <div className="current-value-container">
                            <span className="val-label">Estado Actual</span>
                            <span className="val-num">
                              {latestVal !== null ? latestVal : '-'}
                              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                                {kpi.unit_of_measure}
                              </span>
                            </span>
                          </div>

                          <div className="target-container">
                            <span className="val-label">Meta</span>
                            <div className="target-val">
                              {kpi.target_value} {kpi.unit_of_measure}
                            </div>
                            <div style={{ fontSize: '11px', color: latestVal !== null ? (fulfillment >= 100 ? '#34d399' : '#f59e0b') : 'var(--text-muted)' }}>
                              {latestVal !== null ? `${fulfillment}% Meta` : 'Sin registros'}
                            </div>
                          </div>
                        </div>

                        <div className="kpi-progress-bar-bg">
                          <div 
                            className="kpi-progress-bar-fill"
                            style={{ width: `${latestVal !== null ? Math.min(fulfillment, 100) : 0}%` }}
                          ></div>
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
