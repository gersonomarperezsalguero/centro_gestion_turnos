// frontend/app.js
const API_URL = 'http://localhost:3000';

const formTurno = document.getElementById('form-turno');
const listaTurnos = document.getElementById('lista-turnos');
const btnSiguiente = document.getElementById('btn-siguiente');
const detalleSiguiente = document.getElementById('detalle-siguiente');

// Cargar cola al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarTurnos();
});

// Manejar envío del formulario
formTurno.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const tramite = document.getElementById('tramite').value.trim();
  const prioridad = document.getElementById('prioridad').value;

  if (!nombre || !tramite) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/turnos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, tramite, prioridad })
    });

    if (!respuesta.ok) {
      const error = await respuesta.json();
      alert('Error al crear turno: ' + (error.error || respuesta.status));
      return;
    }

    // Limpiar formulario
    formTurno.reset();
    document.getElementById('prioridad').value = 'normal';

    // Recargar la lista de turnos
    cargarTurnos();
  } catch (err) {
    console.error(err);
    alert('Error de conexión con el servidor.');
  }
});

// Recargar la lista de turnos desde el backend
async function cargarTurnos() {
  try {
    const respuesta = await fetch(`${API_URL}/turnos`);
    const turnos = await respuesta.json();
    pintarTurnos(turnos);
  } catch (err) {
    console.error(err);
    alert('No se pudo obtener la lista de turnos.');
  }
}

// Mostrar turnos en la lista <ul>
function pintarTurnos(turnos) {
  listaTurnos.innerHTML = '';

  if (!turnos || turnos.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No hay turnos en la cola.';
    listaTurnos.appendChild(li);
    return;
  }

  turnos.forEach((t) => {
    const li = document.createElement('li');
    const texto = `${t.id}. ${t.nombre} - ${t.tramite}`;
    const spanPrioridad = document.createElement('span');
    spanPrioridad.classList.add('prioridad', t.prioridad);
    spanPrioridad.textContent = t.prioridad.toUpperCase();

    const spanTexto = document.createElement('span');
    spanTexto.textContent = texto;

    li.appendChild(spanTexto);
    li.appendChild(spanPrioridad);

    listaTurnos.appendChild(li);
  });
}

// Botón "Atender siguiente"
btnSiguiente.addEventListener('click', async () => {
  try {
    const respuesta = await fetch(`${API_URL}/turnos/siguiente`);
    const data = await respuesta.json();

    if (!data.turno) {
      detalleSiguiente.textContent = 'No hay turnos para atender.';
      return;
    }

    const t = data.turno;
    detalleSiguiente.textContent = `Turno #${t.id} - ${t.nombre} (${t.tramite}) [${t.prioridad.toUpperCase()}]`;

    // Actualizar la lista de la cola con la que devuelve el backend
    pintarTurnos(data.cola);
  } catch (err) {
    console.error(err);
    alert('Error al obtener el siguiente turno.');
  }
});