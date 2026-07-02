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
  Activity,
  Check,
  User,
  FileText,
  Image,
  Upload,
  Calendar
} from 'lucide-react';

// Error Boundary Component to capture runtime UI crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '24px', 
          background: '#1e1b4b', 
          color: '#f43f5e', 
          border: '2px solid #e11d48', 
          fontFamily: 'monospace', 
          margin: '40px auto', 
          maxWidth: '800px',
          borderRadius: '12px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          zIndex: 9999, 
          position: 'relative' 
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle /> 🚨 Error en la Interfaz (Render Error)
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '16px', fontSize: '13px' }}>
            Se produjo un error crítico en el renderizado de React. A continuación se detalla el error:
          </p>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            background: '#0f172a', 
            padding: '16px', 
            borderRadius: '8px', 
            color: '#fda4af', 
            fontSize: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })} 
              style={{ 
                padding: '10px 20px', 
                background: '#e11d48', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
              }}
            >
              Reintentar Renderizado
            </button>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '10px 20px', 
                background: 'rgba(255,255,255,0.05)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

function App() {
  // State variables
  const [units, setUnits] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [entries, setEntries] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [resources, setResources] = useState([]);
  const [devRows, setDevRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Navigation & Selection
  const [activeTab, setActiveTab] = useState('all'); // 'all' or unit.id
  const [selectedKpiId, setSelectedKpiId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  
  // Form Modal (General / Commitments)
  const [showModal, setShowModal] = useState(false);
  const [modalKpi, setModalKpi] = useState(null);
  
  // Form Fields - Regular KPI
  const [formValue, setFormValue] = useState('');
  const [formPeriodStart, setFormPeriodStart] = useState('');
  const [formPeriodEnd, setFormPeriodEnd] = useState('');
  const [formNotes, setFormNotes] = useState('');
  
  // Form Fields - Dev Commitment (Efectiva Desarrollo) Month
  const [devMonth, setDevMonth] = useState(new Date().toISOString().slice(0, 7));

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

      // 3. Fetch KPI Entries (for general KPIs)
      const { data: entriesData, error: entriesErr } = await supabase
        .from('kpi_entries')
        .select('*')
        .order('period_end', { ascending: true }); // chronological
      if (entriesErr) throw entriesErr;
      setEntries(entriesData);

      // 4. Fetch Dev Commitments (for Efectiva Desarrollo KPI)
      const { data: commitmentsData, error: commitmentsErr } = await supabase
        .from('dev_commitments')
        .select('*')
        .order('created_at', { ascending: true });
      if (commitmentsErr) throw commitmentsErr;
      setCommitments(commitmentsData || []);

      // 5. Fetch Resources (Developer list)
      const { data: resourcesData, error: resourcesErr } = await supabase
        .from('resources')
        .select('*')
        .order('name');
      if (resourcesErr) throw resourcesErr;
      setResources(resourcesData || []);

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
    const kpi = kpis.find(k => k.id === kpiId);
    
    // Check if it's the custom dynamic KPI
    if (kpi && kpi.name === 'Efectiva Desarrollo') {
      const periods = ['Periodo 01', 'Periodo 02', 'Periodo 03'];
      return periods.map(p => {
        const pCommitments = commitments.filter(c => {
          const cMonth = c.target_month ? c.target_month.slice(0, 7) : ''; // 'YYYY-MM'
          return cMonth === selectedMonth && c.period === p;
        });
        const total = pCommitments.length;
        const delivered = pCommitments.filter(c => c.delivery_date !== null).length;
        // Default to 100% fulfillment if no report commits exist for the period
        const val = total > 0 ? Math.round((delivered / total) * 100) : 100;
        
        return {
          id: p,
          kpi_id: kpiId,
          value: val,
          period_end: p === 'Periodo 01' ? `${selectedMonth}-10` : p === 'Periodo 02' ? `${selectedMonth}-20` : `${selectedMonth}-28`,
          notes: `${delivered} de ${total} entregados`
        };
      });
    }

    return entries.filter(e => e.kpi_id === kpiId);
  }

  function getLatestValue(kpiId) {
    const kpiEntries = getKpiEntries(kpiId);
    if (kpiEntries.length === 0) return null;
    
    const kpi = kpis.find(k => k.id === kpiId);
    if (kpi && kpi.name === 'Efectiva Desarrollo') {
      // For Efectiva Desarrollo, the overall month average is the latest value
      const monthCommitments = commitments.filter(c => c.target_month && c.target_month.slice(0, 7) === selectedMonth);
      if (monthCommitments.length === 0) return null;
      const total = monthCommitments.length;
      const delivered = monthCommitments.filter(c => c.delivery_date !== null).length;
      return Math.round((delivered / total) * 100);
    }
    
    return kpiEntries[kpiEntries.length - 1].value;
  }

  function getPreviousValue(kpiId) {
    const kpi = kpis.find(k => k.id === kpiId);
    if (kpi && kpi.name === 'Efectiva Desarrollo') {
      // Compare current month with the previous month
      const current = new Date(`${selectedMonth}-02`);
      const prevDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      const prevMonthStr = prevDate.toISOString().slice(0, 7);
      
      const prevCommitments = commitments.filter(c => c.target_month && c.target_month.slice(0, 7) === prevMonthStr);
      if (prevCommitments.length === 0) return null;
      const total = prevCommitments.length;
      const delivered = prevCommitments.filter(c => c.delivery_date !== null).length;
      return Math.round((delivered / total) * 100);
    }

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

  function getKpiEntriesColor(kpi) {
    if (!kpi) return '#6366f1';
    const kpiUnit = units.find(u => u.id === kpi.unit_id);
    return getUnitColorHex(kpiUnit?.name);
  }

  async function handleDeleteEntry(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    try {
      const { error } = await supabase
        .from('kpi_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Error al eliminar registro: ' + err.message);
    }
  }

  function renderSVGChart(kpi) {
    const kpiEntries = getKpiEntries(kpi.id);
    if (kpiEntries.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay suficientes datos registrados para generar el gráfico.
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = kpiEntries.map(e => e.value);
    const target = kpi.target_value;
    const allValues = [...values, target];
    const maxVal = Math.max(...allValues, 10);
    const roundedMax = Math.ceil(maxVal * 1.2);

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
    const chartColor = getKpiEntriesColor(kpi);

    return (
      <div className="chart-container" style={{ marginTop: '15px', position: 'relative' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = height - paddingBottom - ratio * chartHeight;
            const val = Math.round(ratio * roundedMax);
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="1" 
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fill="var(--text-muted)" 
                  fontSize="10px"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <line 
            x1={paddingLeft} 
            y1={targetY} 
            x2={width - paddingRight} 
            y2={targetY} 
            stroke="#ef4444" 
            strokeWidth="1.5" 
            strokeDasharray="4 4" 
          />
          <text 
            x={width - paddingRight - 5} 
            y={targetY - 6} 
            textAnchor="end" 
            fill="#ef4444" 
            fontSize="10px" 
            fontWeight="bold"
          >
            Meta: {target}
          </text>

          {pointsCount > 1 && (
            <path 
              d={areaD} 
              fill={`url(#area-gradient-${kpi.id})`}
            />
          )}

          <path 
            d={pathD} 
            fill="none" 
            stroke={chartColor} 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round" 
          />

          {kpiEntries.map((entry, idx) => {
            const x = getX(idx);
            const y = getY(entry.value);
            return (
              <g key={idx} className="chart-dot-group">
                <circle 
                  cx={x} 
                  cy={y} 
                  r="5" 
                  fill={chartColor} 
                  stroke="var(--bg-secondary)" 
                  strokeWidth="2" 
                />
                <title>{`Valor: ${entry.value}\nPeriodo: ${entry.period_end}`}</title>
              </g>
            );
          })}

          {kpiEntries.map((entry, idx) => {
            const x = getX(idx);
            let label = '';
            if (kpi.name === 'Efectiva Desarrollo') {
              label = entry.id;
            } else {
              const date = new Date(entry.period_end);
              label = `${date.getDate()}/${date.getMonth() + 1}`;
            }
            return (
              <text 
                key={idx} 
                x={x} 
                y={height - paddingBottom + 18} 
                textAnchor="middle" 
                fill="var(--text-muted)" 
                fontSize="10px"
              >
                {label}
              </text>
            );
          })}

          <defs>
            <linearGradient id={`area-gradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
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
      return Math.min(150, Math.round((value / target) * 100)); // Cap visual fill
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

  // Unit Averages
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

  // System averages
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
  async function handleGeneralSubmit(e) {
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

      setShowModal(false);
      setFormValue('');
      setFormPeriodStart('');
      setFormPeriodEnd('');
      setFormNotes('');
      await fetchData();
    } catch (err) {
      console.error('Error inserting KPI:', err);
      alert('Error al registrar valor: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Dev Commitment Submit handler (Bulk Save)
  async function handleDevCommitmentSubmit(e) {
    e.preventDefault();
    if (devRows.length === 0) {
      alert('Por favor, añade al menos un registro.');
      return;
    }

    setSubmitting(true);
    try {
      const insertPayloads = [];

      for (const row of devRows) {
        if (!row.reportNumber || !row.developerName || !row.priority || !row.period) {
          throw new Error('Por favor, completa los campos requeridos (*) de todos los reportes.');
        }

        let attachmentUrl = null;

        // Upload file if selected for this row
        if (row.file) {
          const fileExt = row.file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(fileName, row.file);

          if (uploadError) {
            console.warn('Could not upload attachment:', uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(fileName);
            attachmentUrl = urlData.publicUrl;
          }
        }

        insertPayloads.push({
          report_number: row.reportNumber,
          priority: parseInt(row.priority),
          developer_name: row.developerName,
          period: row.period,
          target_month: `${devMonth}-01`,
          delivery_date: row.deliveryDate || null,
          notes: row.notes || null,
          attachment_url: attachmentUrl
        });
      }

      const { error } = await supabase
        .from('dev_commitments')
        .insert(insertPayloads);

      if (error) throw error;

      setShowModal(false);
      setDevRows([]);
      await fetchData();
    } catch (err) {
      console.error('Error saving commitments:', err);
      alert('Error al guardar compromisos: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Bulk Form Row Helpers
  function addDevRow() {
    setDevRows([
      ...devRows,
      {
        id: Math.random().toString(36).substring(2, 7),
        reportNumber: '',
        priority: '1',
        developerName: resources.length > 0 ? resources[0].name : '',
        period: 'Periodo 01',
        deliveryDate: '',
        notes: '',
        file: null,
        fileName: ''
      }
    ]);
  }

  function removeDevRow(id) {
    if (devRows.length === 1) {
      alert('Debes mantener al menos un registro en la lista.');
      return;
    }
    setDevRows(devRows.filter(row => row.id !== id));
  }

  function updateDevRow(id, field, value) {
    setDevRows(devRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  }

  // Commitment Toggles & Deletes
  async function toggleCommitmentDelivery(id, currentDelivery) {
    const nextDelivery = currentDelivery ? null : new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase
        .from('dev_commitments')
        .update({ delivery_date: nextDelivery })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error updating delivery:', err);
      alert('Error: ' + err.message);
    }
  }

  async function handleDeleteCommitment(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este compromiso?')) return;
    try {
      const { error } = await supabase
        .from('dev_commitments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error deleting commitment:', err);
      alert('Error: ' + err.message);
    }
  }

  // Open modal helper
  function openAddModal(kpi) {
    setModalKpi(kpi);
    if (kpi.name === 'Efectiva Desarrollo') {
      setDevMonth(selectedMonth);
      setDevRows([
        {
          id: Math.random().toString(36).substring(2, 7),
          reportNumber: '',
          priority: '1',
          developerName: resources.length > 0 ? resources[0].name : '',
          period: 'Periodo 01',
          deliveryDate: '',
          notes: '',
          file: null,
          fileName: ''
        }
      ]);
    } else {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFormPeriodStart(firstDay.toISOString().split('T')[0]);
      setFormPeriodEnd(today.toISOString().split('T')[0]);
      setFormValue('');
      setFormNotes('');
    }
    setShowModal(true);
  }

  // Filters
  const filteredKpis = activeTab === 'all' 
    ? kpis 
    : kpis.filter(k => k.unit_id === activeTab);

  const selectedKpi = kpis.find(k => k.id === selectedKpiId);
  const selectedKpiUnit = selectedKpi ? units.find(u => u.id === selectedKpi.unit_id) : null;
  const selectedKpiEntries = selectedKpi ? getKpiEntries(selectedKpi.id) : [];
  
  const selectedKpiCommitments = selectedKpi && selectedKpi.name === 'Efectiva Desarrollo'
    ? commitments.filter(c => c.target_month && c.target_month.slice(0, 7) === selectedMonth)
    : [];

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

            {/* Layout switch */}
            {activeTab === 'all' ? (
              /* Executive Overview Panel */
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

                {/* Month Selection globally inside Resume General */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>Mes de Evaluación:</span>
                    <input 
                      type="month"
                      className="form-input"
                      style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(0,0,0,0.2)' }}
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    *Los KPIs dinámicos se recalculan automáticamente para el mes de {selectedMonth}.
                  </p>
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
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}
                                  onClick={() => {
                                    setSelectedKpiId(kpi.id);
                                    setActiveTab(unit.id);
                                  }}
                                >
                                  <span style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{kpi.name}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: '700', color: statusColor }}>
                                      {val !== null ? `${val}${kpi.unit_of_measure === 'Porcentaje' ? '%' : ''} (${kpiFulfillment}%)` : 'Sin datos'}
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
              /* Unit Dashboard Grid Layout */
              <div className="dashboard-grid">
                
                {/* Left Panel: KPI Cards */}
                <div>
                  {/* Month Selection inside unit views */}
                  <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Mes de Medición:</span>
                    <input 
                      type="month"
                      className="form-input"
                      style={{ padding: '4px 10px', fontSize: '12px', background: 'rgba(0,0,0,0.2)' }}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                  </div>

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
                                      {kpi.unit_of_measure === 'Porcentaje' ? '%' : ` ${kpi.unit_of_measure}`}
                                    </span>
                                    {renderTrendIndicator(kpi)}
                                  </span>
                                </div>

                                <div className="target-container">
                                  <span className="val-label">Meta</span>
                                  <div className="target-val">
                                    {kpi.target_value} {kpi.unit_of_measure === 'Porcentaje' ? '%' : kpi.unit_of_measure}
                                  </div>
                                  <div style={{ fontSize: '11px', color: statusColor }}>
                                    {latestVal !== null ? `${fulfillment}% Meta` : 'Sin registros'}
                                  </div>
                                </div>
                              </div>

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

                      {/* Historic List - Custom layout for Efectiva Desarrollo */}
                      {selectedKpi.name === 'Efectiva Desarrollo' ? (
                        <div className="history-section">
                          <div className="history-title">
                            <span>Compromisos de Desarrollo ({selectedMonth})</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                              {selectedKpiCommitments.length} asignados
                            </span>
                          </div>

                          {selectedKpiCommitments.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                              No hay reportes registrados para este mes. Presiona "Registrar" para añadir uno.
                            </p>
                          ) : (
                            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '8px' }}>Reporte</th>
                                    <th style={{ padding: '8px' }}>Prioridad</th>
                                    <th style={{ padding: '8px' }}>Desarrollador</th>
                                    <th style={{ padding: '8px' }}>Periodo</th>
                                    <th style={{ padding: '8px' }}>Entrega QA</th>
                                    <th style={{ padding: '8px' }}>Adjunto</th>
                                    <th style={{ padding: '8px' }}>Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedKpiCommitments.map(c => {
                                    const isDelivered = c.delivery_date !== null;
                                    return (
                                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.report_number}</td>
                                        <td style={{ padding: '8px' }}>
                                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                            P-{c.priority}
                                          </span>
                                        </td>
                                        <td style={{ padding: '8px' }}>{c.developer_name}</td>
                                        <td style={{ padding: '8px' }}>{c.period}</td>
                                        <td style={{ padding: '8px' }}>
                                          {isDelivered ? (
                                            <span style={{ color: '#34d399', fontWeight: '600' }} title={`Entregado el ${c.delivery_date}`}>
                                              ✓ {c.delivery_date}
                                            </span>
                                          ) : (
                                            <span style={{ color: '#ef4444', fontWeight: '600' }}>Pendiente</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                          {c.attachment_url ? (
                                            <a 
                                              href={c.attachment_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              style={{ color: 'var(--color-dev)', textDecoration: 'underline' }}
                                            >
                                              Ver Imagen
                                            </a>
                                          ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                                          <button 
                                            onClick={() => toggleCommitmentDelivery(c.id, c.delivery_date)}
                                            style={{ 
                                              background: isDelivered ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)', 
                                              color: isDelivered ? '#ef4444' : '#34d399', 
                                              border: 'none', 
                                              padding: '4px 8px', 
                                              borderRadius: '4px', 
                                              cursor: 'pointer',
                                              fontSize: '11px',
                                              fontWeight: '600'
                                            }}
                                          >
                                            {isDelivered ? 'Revertir' : 'Entregar'}
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteCommitment(c.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Standard logs list for regular KPIs */
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
                                        {entry.value} {selectedKpi.unit_of_measure === 'Porcentaje' ? '%' : selectedKpi.unit_of_measure}
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
                      )}
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
          <div 
            className="glass-panel modal-content" 
            style={{ 
              background: 'var(--bg-secondary)', 
              maxWidth: modalKpi.name === 'Efectiva Desarrollo' ? '900px' : '480px',
              width: '90%'
            }}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '18px' }}>Registrar: {modalKpi.name}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {modalKpi.name === 'Efectiva Desarrollo' ? (
              /* Custom Form for Efectiva Desarrollo Commitment (Bulk Save) */
              <form onSubmit={handleDevCommitmentSubmit}>
                
                {/* Global Month Selector */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Mes de la Demanda (Aplica para todos):</span>
                    <input 
                      type="month"
                      required
                      className="form-input"
                      style={{ padding: '6px 12px', width: '160px', background: 'rgba(0,0,0,0.2)' }}
                      value={devMonth}
                      onChange={(e) => setDevMonth(e.target.value)}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={addDevRow}
                    style={{ background: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                  >
                    <Plus size={14} /> + Añadir Otro Reporte
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                  {devRows.map((row, index) => (
                    <div 
                      key={row.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '10px',
                        position: 'relative'
                      }}
                    >
                      {/* Row Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-dev)', textTransform: 'uppercase' }}>
                          Reporte #{index + 1}
                        </span>
                        {devRows.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeDevRow(row.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' }}
                          >
                            <Trash2 size={12} /> Quitar
                          </button>
                        )}
                      </div>

                      {/* Inputs Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Número de Reporte *</label>
                          <input 
                            type="text"
                            required
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            placeholder="Ej: REP-4859"
                            value={row.reportNumber}
                            onChange={(e) => updateDevRow(row.id, 'reportNumber', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Prioridad *</label>
                          <select 
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            value={row.priority}
                            onChange={(e) => updateDevRow(row.id, 'priority', e.target.value)}
                          >
                            {[-1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Recurso Asignado *</label>
                          <select 
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            value={row.developerName}
                            onChange={(e) => updateDevRow(row.id, 'developerName', e.target.value)}
                            required
                          >
                            <option value="">-- Seleccionar --</option>
                            {resources.map(res => (
                              <option key={res.id} value={res.name}>{res.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Periodo *</label>
                          <select 
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            value={row.period}
                            onChange={(e) => updateDevRow(row.id, 'period', e.target.value)}
                          >
                            <option value="Periodo 01">Periodo 01 (Día 1-10)</option>
                            <option value="Periodo 02">Periodo 02 (Día 11-20)</option>
                            <option value="Periodo 03">Periodo 03 (Día 21-Fin)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Entrega QA (Opcional)</label>
                          <input 
                            type="date"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '5px 10px' }}
                            value={row.deliveryDate}
                            onChange={(e) => updateDevRow(row.id, 'deliveryDate', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Adjuntar Imagen</label>
                          <div>
                            <input 
                              type="file"
                              accept="image/*"
                              id={`file-upload-${row.id}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  updateDevRow(row.id, 'file', file);
                                  updateDevRow(row.id, 'fileName', file.name);
                                }
                              }}
                            />
                            <label 
                              htmlFor={`file-upload-${row.id}`} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                border: '1px dashed rgba(255,255,255,0.15)', 
                                padding: '6px 10px', 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.01)',
                                fontSize: '11px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Upload size={12} />
                              {row.fileName ? row.fileName : 'Seleccionar imagen (.png, .jpg)'}
                            </label>
                          </div>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Observaciones</label>
                          <input 
                            type="text"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            placeholder="Comentarios o notas de este reporte..."
                            value={row.notes}
                            onChange={(e) => updateDevRow(row.id, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px' }}>
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
                    {submitting ? 'Guardando...' : `Guardar Todos (${devRows.length})`}
                  </button>
                </div>
              </form>
            ) : (
              /* Standard Form for Regular KPIs */
              <form onSubmit={handleGeneralSubmit}>
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
            )}
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

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
