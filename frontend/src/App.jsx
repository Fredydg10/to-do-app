/**
 * ==========================================
 * COMPONENTE PRINCIPAL - FRONTEND
 * Stack: React + Vite + Axios + Lucide Icons + React Hook Form
 * Desplegado en: Vercel
 * ==========================================
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Plus, Trash2, Edit2, Calculator, X, User, Settings, Info, LogOut } from 'lucide-react';
import Auth from './Auth';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 1. Crear instancia de axios con interceptor para el Token
const api = axios.create({
  baseURL: API_URL,
});

// Agregar interceptor para incluir el token en cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  // Estados de autenticación
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Estados de la app
  const [vista, setVista] = useState('dashboard');
  const [tareas, setTareas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  
  // Estados de la calculadora
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcHistory, setCalcHistory] = useState('');

  // 2. React Hook Form setup (¡AHORA SÍ DENTRO DEL COMPONENTE!)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      titulo: '',
      descripcion: '',
      prioridad: 'Medium',
      estado: 'To-Do',
      fecha_vencimiento: '',
      categoria_id: 1
    }
  });

  // 3. Verificar si hay token al iniciar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    
    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  // 4. Cargar tareas (solo si hay usuario)
  useEffect(() => {
    if (usuario) {
      cargarTareas();
    }
  }, [usuario]);

  const cargarTareas = async () => {
    try {
      const response = await api.get('/tareas');
      setTareas(response.data);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    }
  };

  // Funciones de la calculadora
  const handleCalcClick = (valor) => {
    if (valor === 'C') {
      setCalcDisplay('0');
      setCalcHistory('');
    } else if (valor === 'DEL') {
      setCalcDisplay(calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : '0');
    } else if (valor === '=') {
      try {
        // eslint-disable-next-line no-eval
        const resultado = eval(calcDisplay);
        setCalcHistory(calcDisplay + ' =');
        setCalcDisplay(String(resultado));
      } catch (error) {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay(calcDisplay === '0' ? valor : calcDisplay + valor);
    }
  };

  // 5. Función que se ejecuta al enviar el formulario (React Hook Form)
  const onSubmit = async (data) => {
    try {
      if (tareaEditando) {
        await api.put(`/tareas/${tareaEditando.id}`, data);
      } else {
        await api.post('/tareas', data);
      }
      
      reset(); // Limpia el formulario
      setTareaEditando(null);
      setMostrarFormulario(false);
      cargarTareas();
    } catch (error) {
      const mensajes = error.response?.data?.detalles 
    ? error.response.data.detalles.join(', ') 
    : (error.response?.data?.error || 'Error en el servidor');
  
  setError(mensajes); // Esto mostrará el error bonito en la pantalla
  }
  };

  const eliminarTarea = async (id) => {
    if (window.confirm('¿Eliminar esta tarea?')) {
      try {
        await api.delete(`/tareas/${id}`);
        cargarTareas();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  const limpiarTodasLasTareas = async () => {
    if (window.confirm('¿Estás seguro de eliminar TODAS las tareas? Esta acción no se puede deshacer.')) {
      try {
        for (const tarea of tareas) {
          await api.delete(`/tareas/${tarea.id}`);
        }
        setTareas([]);
        alert('¡Todas las tareas han sido eliminadas!');
      } catch (error) {
        console.error('Error al limpiar tareas:', error);
        alert('Error al eliminar las tareas.');
      }
    }
  };

  // 6. Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setVista('dashboard');
    setTareas([]);
  };

  // 7. Pantalla de carga mientras verifica el token
  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  // 8. Si NO hay usuario, mostrar pantalla de Login/Registro
  if (!usuario) {
    return <Auth onLoginSuccess={(user) => setUsuario(user)} />;
  }

  // 9. Si HAY usuario, mostrar la aplicación principal
  return (
    <div className="app">
      <header className="header">
        <h1>Calc & Tasks</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <User size={18} />
            <span style={{ fontSize: '0.9rem' }}>{usuario.nombre}</span>
          </div>
          <nav className="nav">
            <button className={vista === 'dashboard' ? 'active' : ''} onClick={() => setVista('dashboard')}>Dashboard</button>
            <button className={vista === 'projects' ? 'active' : ''} onClick={() => setVista('projects')}>Projects</button>
            <button className={vista === 'settings' ? 'active' : ''} onClick={() => setVista('settings')}>Settings</button>
            <button onClick={handleLogout} className="btn-logout" title="Cerrar Sesión">
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* VISTA DASHBOARD */}
        {vista === 'dashboard' && (
          <div className="dashboard">
            <div className="calculator-section">
              <h2>Quick Calc</h2>
              <div className="calculator">
                <div className="calc-display">
                  <div className="calc-history">{calcHistory}</div>
                  <div className="calc-result">{calcDisplay}</div>
                </div>
                <div className="calc-buttons">
                  {['C', 'DEL', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((btn) => (
                    <button 
                      key={btn} 
                      className={`calc-btn ${btn === '=' ? 'equals' : ''}`}
                      onClick={() => handleCalcClick(btn)}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="tasks-section">
              <div className="tasks-header">
                <h2>To-Do</h2>
                <h3>Tasks & Goals</h3>
                <button className="btn-add" onClick={() => setMostrarFormulario(true)}>
                  <Plus size={20} />
                </button>
              </div>

              <div className="tasks-list">
                {tareas.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center' }}>No hay tareas. ¡Crea una!</p>
                ) : (
                  tareas.map(tarea => (
                    <div key={tarea.id} className="task-card">
                      <div className="task-header">
                        <h4>{tarea.titulo}</h4>
                      </div>
                      <p className="task-priority">{tarea.prioridad}</p>
                      <p className="task-date">
                        {tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento).toLocaleDateString() : 'Sin fecha'}
                      </p>
                      <div className="task-actions">
                        <button onClick={() => eliminarTarea(tarea.id)} className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VISTA PROJECTS */}
        {vista === 'projects' && (
          <div className="projects-view">
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Mis Proyectos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="project-card" style={{ borderTop: '4px solid #1E40AF' }}>
                <h3>Work</h3>
                <p>{tareas.filter(t => t.categoria_id === 1).length} tareas pendientes</p>
              </div>
              <div className="project-card" style={{ borderTop: '4px solid #059669' }}>
                <h3>Personal</h3>
                <p>{tareas.filter(t => t.categoria_id === 2).length} tareas pendientes</p>
              </div>
              <div className="project-card" style={{ borderTop: '4px solid #0D9488' }}>
                <h3>Finance</h3>
                <p>{tareas.filter(t => t.categoria_id === 3).length} tareas pendientes</p>
              </div>
            </div>
          </div>
        )}

        {/* VISTA SETTINGS */}
        {vista === 'settings' && (
          <div className="settings-view">
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>
              <Settings size={28} style={{ marginRight: '10px' }} />
              Configuración
            </h2>

            <div className="settings-card">
              <h3>
                <User size={20} style={{ marginRight: '8px' }} />
                Perfil de Usuario
              </h3>
              <div className="profile-info">
                <div className="profile-field">
                  <label>Nombre:</label>
                  <input type="text" value={usuario.nombre} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <input type="email" value={usuario.email} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>
                <Trash2 size={20} style={{ marginRight: '8px' }} />
                Gestión de Tareas
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Tienes <strong>{tareas.length}</strong> tareas en tu cuenta.
              </p>
              <button className="btn-danger" onClick={limpiarTodasLasTareas}>
                <Trash2 size={16} style={{ marginRight: '8px' }} />
                Eliminar Todas las Tareas
              </button>
            </div>

            <div className="settings-card">
              <h3>
                <Info size={20} style={{ marginRight: '8px' }} />
                Información de la App
              </h3>
              <div className="app-info">
                <p><strong>Versión:</strong> 1.0.0 (Con Autenticación)</p>
                <p><strong>Frontend:</strong> React + Vite (Vercel)</p>
                <p><strong>Backend:</strong> Node.js + Express + JWT (Render)</p>
                <p><strong>Base de Datos:</strong> PostgreSQL (Supabase)</p>
                <p><strong>Desarrollador:</strong> Fredydg10</p>
              </div>
            </div>

            <button className="btn-back" onClick={() => setVista('dashboard')}>
              Volver al Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Formulario Modal con React Hook Form */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{tareaEditando ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
              <button onClick={() => setMostrarFormulario(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="task-form">
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  {...register('titulo', { 
                    required: 'El título es obligatorio',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                  })}
                  placeholder="Ej: Aprender React"
                />
                {errors.titulo && <span className="error-message">{errors.titulo.message}</span>}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  {...register('descripcion')}
                  placeholder="Detalles de la tarea..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prioridad</label>
                  <select {...register('prioridad')}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select {...register('estado')}>
                    <option value="To-Do">To-Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fecha de Vencimiento *</label>
                <input
                  type="date"
                  {...register('fecha_vencimiento', { 
                    required: 'La fecha es obligatoria'
                  })}
                />
                {errors.fecha_vencimiento && <span className="error-message">{errors.fecha_vencimiento.message}</span>}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setMostrarFormulario(false)} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {tareaEditando ? 'Actualizar' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;