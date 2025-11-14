// backend/index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// --- Middlewares ---
app.use(cors());           // Permitir peticiones desde el frontend
app.use(express.json());   // Leer JSON en el cuerpo de las peticiones

// --- Datos en memoria ---
let colaTurnos = [];   // turnos pendientes
let ultimos3Pedidos = []; // últimos 3 turnos SOLICITADOS (creados)
let nextId = 1;        // id autoincremental

// --- Endpoint POST /turnos ---
// Agrega un turno a la cola
app.post('/turnos', (req, res) => {
  const { nombre, tramite, prioridad } = req.body;

  // Validaciones sencillas
  if (!nombre || !tramite || !prioridad) {
    return res.status(400).json({ error: 'Faltan datos del turno.' });
  }

  const turno = {
    id: nextId++,
    nombre,
    tramite,
    prioridad: prioridad === 'urgente' ? 'urgente' : 'normal',
    creadoEn: new Date().toISOString()
  };

  // Agregamos a la cola
  colaTurnos.push(turno);

  // Guardamos en el historial de los últimos 3 pedidos
  ultimos3Pedidos.push(turno);
  if (ultimos3Pedidos.length > 3) {
    ultimos3Pedidos.shift(); // elimina el más viejo para que solo queden 3
  }

  return res.status(201).json(turno);
});

// (Extra) Endpoint GET /turnos para mostrar la cola en pantalla
// No está en el enunciado, pero ayuda al frontend a listar los turnos
app.get('/turnos', (req, res) => {
  res.json(colaTurnos);
});

// --- Endpoint GET /turnos/siguiente ---
// Devuelve y quita de la cola el siguiente turno a atender
app.get('/turnos/siguiente', (req, res) => {
  if (colaTurnos.length === 0) {
    return res.json({
      mensaje: 'No hay turnos en la cola.',
      turno: null,
      cola: colaTurnos
    });
  }

  // Regla: si NO hubo urgentes en los últimos 3 pedidos de turno,
  // el siguiente es simplemente el más antiguo (el primero de la cola).
  const huboUrgenteEnUltimos3 = ultimos3Pedidos.some(
    (t) => t.prioridad === 'urgente'
  );

  let indiceSeleccionado = 0;

  if (huboUrgenteEnUltimos3) {
    // Si hubo urgentes recientemente:
    // 1. Atender primero urgentes en orden de llegada
    const indiceUrgente = colaTurnos.findIndex(
      (t) => t.prioridad === 'urgente'
    );

    if (indiceUrgente !== -1) {
      indiceSeleccionado = indiceUrgente;
    } else {
      // 2. Si ya no hay urgentes, atender el más antiguo normal
      indiceSeleccionado = 0;
    }
  } else {
    // Si NO hubo urgentes en los últimos 3 pedidos:
    // atender más antiguo (ya es 0)
    indiceSeleccionado = 0;
  }

  const [turnoSeleccionado] = colaTurnos.splice(indiceSeleccionado, 1);

  return res.json({
    mensaje: 'Turno a atender',
    turno: turnoSeleccionado,
    cola: colaTurnos
  });
});

// --- Arrancar servidor ---
app.listen(PORT, () => {
  console.log(`API de turnos escuchando en http://localhost:${PORT}`);
});