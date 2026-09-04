import { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, X } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Auth({ onLoginSuccess }) {
  const [modo, setModo] = useState('login'); // 'login' o 'registro'
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = modo === 'login' ? '/login' : '/registro';
      const response = await axios.post(`${API_URL}${endpoint}`, formData);

      if (modo === 'login') {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        onLoginSuccess(response.data.usuario);
      } else {
        // Si es registro, cambiar automáticamente a login
        alert('¡Usuario creado con éxito! Ahora inicia sesión.');
        setModo('login');
        setFormData({ nombre: '', email: '', password: '' });
      }
    } catch (error) {
      const mensajes = error.response?.data?.detalles 
    ? error.response.data.detalles.join(', ') 
    : (error.response?.data?.error || 'Error en el servidor');
  
  setError(mensajes); // Esto mostrará el error bonito en la pantalla
}
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Calc & Tasks</h1>
          <p>{modo === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratis'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {modo === 'registro' && (
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Tu nombre"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Cargando...' : modo === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); }}>
              {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;