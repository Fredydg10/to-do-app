// Importamos la app exportada desde server.js
const request = require('supertest');
const app = require('../server'); 

describe('API de To-Do App', () => {
  
  it('debería responder con un estado 200 en la ruta raíz', async () => {
    const res = await request(app).get('/'); 
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mensaje');
  });

  it('debería rechazar obtener tareas sin token (403 o 401)', async () => {
    // Como /api/tareas requiere token, esperamos que nos rechace si no lo enviamos
    const res = await request(app).get('/api/tareas'); 
    expect([401, 403]).toContain(res.status);
  });

});