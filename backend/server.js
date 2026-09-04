/**
 * ==========================================
 * SERVIDOR BACKEND - TO-DO APP
 * Stack: Node.js + Express + PostgreSQL (Supabase)
 * Desplegado en: Render | Listo para CI/CD
 * ==========================================
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. IMPORTAR LAS VALIDACIONES DE JOI
const { validar, registroSchema, loginSchema, tareaSchema } = require('./validaciones');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// CONEXIÓN A POSTGRESQL
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Prueba de conexión al iniciar (SOLO si NO estamos en CI/GitHub Actions)
if (process.env.CI !== 'true') {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ Error al conectar con PostgreSQL:', err.message);
    } else {
      console.log('✅ Conexión a PostgreSQL exitosa');
      release();
    }
  });
} else {
  console.log('🔧 Modo CI detectado - omitiendo conexión de prueba a base de datos');
}

// ==========================================
// MIDDLEWARE DE SEGURIDAD (JWT)
// ==========================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado. No hay token.' });
  }

  try {
    const tokenLimpio = token.split(' ')[1];
    const decoded = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

// ==========================================
// RUTAS DE LA API
// ==========================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando!' });
});

// GET - Obtener todas las tareas
app.get('/api/tareas', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.nombre as categoria_nombre, c.color as categoria_color
      FROM tareas t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      WHERE t.usuario_id = $1
      ORDER BY t.creado_en DESC
    `, [req.usuario.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST - Crear nueva tarea (CON VALIDACIÓN JOI)
app.post('/api/tareas', validar(tareaSchema), verificarToken, async (req, res) => {
  const { titulo, descripcion, prioridad, estado, fecha_vencimiento, categoria_id } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO tareas (titulo, descripcion, prioridad, estado, fecha_vencimiento, categoria_id, usuario_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [titulo, descripcion, prioridad, estado, fecha_vencimiento, categoria_id, req.usuario.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

// PUT - Actualizar tarea (CON VALIDACIÓN JOI)
app.put('/api/tareas/:id', validar(tareaSchema), verificarToken, async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, prioridad, estado, fecha_vencimiento, categoria_id } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE tareas 
       SET titulo = $1, descripcion = $2, prioridad = $3, estado = $4, 
           fecha_vencimiento = $5, categoria_id = $6
       WHERE id = $7 AND usuario_id = $8
       RETURNING *`,
      [titulo, descripcion, prioridad, estado, fecha_vencimiento, categoria_id, id, req.usuario.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

// DELETE - Eliminar tarea
app.delete('/api/tareas/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM tareas WHERE id = $1 AND usuario_id = $2', [id, req.usuario.id]);
    res.json({ mensaje: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

// GET - Obtener categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==========================================
// RUTAS DE AUTENTICACIÓN (JWT)
// ==========================================

// 1. REGISTRO DE USUARIO (CON VALIDACIÓN JOI)
app.post('/api/registro', validar(registroSchema), async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const passwordEncriptada = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, passwordEncriptada]
    );
    res.status(201).json({ mensaje: '¡Usuario creado con éxito!', usuario: result.rows[0] });
  } catch (error) {
    console.error('🔴 ERROR REGISTRO:', error.message);
    res.status(500).json({ error: 'Error al registrar usuario: ' + error.message });
  }
});

// 2. LOGIN DE USUARIO (CON VALIDACIÓN JOI)
app.post('/api/login', validar(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      mensaje: '¡Login exitoso!', 
      token: token, 
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } 
    });

  } catch (error) {
    console.error('🔴 ERROR LOGIN:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ==========================================
// MANEJADOR DE ERRORES GLOBAL
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Error global no manejado:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// ==========================================
// EXPORTACIÓN Y ARRANQUE (¡CRUCIAL PARA JEST!)
// ==========================================

// 1. Exportamos la app para que Supertest pueda usarla
module.exports = app;

// 2. Solo levantamos el servidor si se ejecuta DIRECTAMENTE (no en tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}