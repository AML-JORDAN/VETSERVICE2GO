// PANTALLA: AGENDAR CITA
// Paso 1: mascota · Paso 2: servicios · Paso 3: fecha y hora
//
// También sirve para REAGENDAR un ticket que un empleado rechazó:
// agendar.html?reagendar=5 -> solo se elige otro día y otra hora para el ticket #5.

// Horarios de atención (los mismos de la app)
const HORARIOS = ["15:30 - 16:10", "16:00 - 16:40", "16:30 - 17:10", "17:00 - 17:40"];

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
  "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const listaMascotas = document.getElementById("mascota");
const casillasServicio = document.querySelectorAll('input[name="servicio"]');
const textoTotal = document.getElementById("total");
const nombreMes = document.getElementById("nombreMes");
const btnMesAnterior = document.getElementById("btnMesAnterior");
const btnMesSiguiente = document.getElementById("btnMesSiguiente");
const contenedorDias = document.getElementById("dias");
const contenedorHorarios = document.getElementById("horarios");
const fechaElegidaTexto = document.getElementById("fechaElegidaTexto");
const btnConfirmar = document.getElementById("btnConfirmar");

// Number() de algo que no viene en la dirección da 0, y 0 significa "cita nueva"
const datosDireccion = new URLSearchParams(window.location.search);
const reagendarId = Number(datosDireccion.get("reagendar"));

// Las citas se agendan a partir de mañana
const hoy = new Date();
const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
const primerDiaPermitido = fechaComoTexto(manana);

// Lo que el usuario va eligiendo
let fechaElegida = primerDiaPermitido;   // empieza en mañana
let horarioElegido = "";
let horariosOcupados = [];

// Mes que se ve en el calendario (empieza en el mes de mañana)
let anioVisible = manana.getFullYear();
let mesVisible = manana.getMonth();      // 0 = enero ... 11 = diciembre

// ============================================
// PASO 1: MASCOTAS
// ============================================

// Llenamos la lista desplegable con las mascotas del usuario
async function cargarMascotas() {
  const mascotas = await obtenerMascotas(usuarioId);

  if (mascotas.length === 0) {
    // No tiene mascotas: escondemos el formulario y mostramos el aviso
    document.getElementById("formulario").hidden = true;
    document.getElementById("sinMascotas").hidden = false;
    return;
  }

  // Por cada mascota creamos un <option> dentro del <select>
  for (const mascota of mascotas) {
    const opcion = document.createElement("option");
    opcion.value = mascota.id;
    opcion.textContent = mascota.nombre + " (" + mascota.especie + ")";
    listaMascotas.appendChild(opcion);
  }
}

// ============================================
// PASO 2: SERVICIOS Y TOTAL
// ============================================

// Suma el precio (data-precio) de cada casilla marcada
function calcularTotal() {
  let total = 0;
  for (const casilla of casillasServicio) {
    if (casilla.checked) {
      total = total + Number(casilla.dataset.precio);
    }
  }
  return total;
}

// Cada vez que se marca o desmarca una casilla, actualizamos el total
for (const casilla of casillasServicio) {
  casilla.addEventListener("change", function () {
    textoTotal.textContent = formatoDinero(calcularTotal());
  });
}

// ============================================
// PASO 3: CALENDARIO
// ============================================

function dibujarCalendario() {
  nombreMes.textContent = MESES[mesVisible] + " de " + anioVisible;
  contenedorDias.innerHTML = ""; // borramos los días que había

  // ¿En qué día de la semana cae el día 1? (0 = domingo, 6 = sábado)
  const primerDiaSemana = new Date(anioVisible, mesVisible, 1).getDay();

  // ¿Cuántos días tiene el mes? (el "día 0" del mes siguiente es el último de este mes)
  const diasDelMes = new Date(anioVisible, mesVisible + 1, 0).getDate();

  // Espacios vacíos antes del día 1, para que caiga en su columna
  for (let i = 0; i < primerDiaSemana; i++) {
    contenedorDias.appendChild(document.createElement("span"));
  }

  // Un botón por cada día del mes
  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fecha = fechaComoTexto(new Date(anioVisible, mesVisible, dia));

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "dia";
    boton.textContent = dia;

    // Los días anteriores a mañana no se pueden elegir
    // (las fechas "año-mes-día" se pueden comparar como texto)
    if (fecha < primerDiaPermitido) {
      boton.disabled = true;
    }

    // El día elegido se pinta con un círculo
    if (fecha === fechaElegida) {
      boton.classList.add("elegido");
    }

    boton.addEventListener("click", function () {
      fechaElegida = fecha;
      horarioElegido = ""; // al cambiar de día, hay que volver a elegir horario
      dibujarCalendario();
      cargarHorarios();
    });

    contenedorDias.appendChild(boton);
  }

  // No dejamos regresar a meses que ya pasaron
  btnMesAnterior.disabled = anioVisible === manana.getFullYear() && mesVisible === manana.getMonth();
}

btnMesAnterior.addEventListener("click", function () {
  mesVisible = mesVisible - 1;
  if (mesVisible < 0) {
    // antes de enero viene diciembre del año anterior
    mesVisible = 11;
    anioVisible = anioVisible - 1;
  }
  dibujarCalendario();
});

btnMesSiguiente.addEventListener("click", function () {
  mesVisible = mesVisible + 1;
  if (mesVisible > 11) {
    // después de diciembre viene enero del año siguiente
    mesVisible = 0;
    anioVisible = anioVisible + 1;
  }
  dibujarCalendario();
});

// ============================================
// PASO 3: HORARIOS
// ============================================

// Pregunta a la base de datos qué horarios ya están ocupados ese día
async function cargarHorarios() {
  horariosOcupados = await obtenerHorariosOcupados(fechaElegida);
  dibujarHorarios();
}

function dibujarHorarios() {
  fechaElegidaTexto.textContent = formatoFecha(fechaElegida);
  contenedorHorarios.innerHTML = "";

  for (const horario of HORARIOS) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "horario";

    if (horariosOcupados.includes(horario)) {
      // Ya hay una cita a esa hora: no se puede elegir
      boton.textContent = "🔴 OCUPADO  •  " + horario;
      boton.disabled = true;
    } else {
      boton.textContent = "🟢 DISPONIBLE  •  " + horario;

      if (horario === horarioElegido) {
        boton.classList.add("elegido");
      }

      boton.addEventListener("click", function () {
        horarioElegido = horario;
        dibujarHorarios();
      });
    }

    contenedorHorarios.appendChild(boton);
  }
}

// ============================================
// REAGENDAR (solo con agendar.html?reagendar=5)
// ============================================

// Muestra los datos del ticket rechazado y esconde los pasos 1 y 2
async function prepararReagendar() {
  const recibo = await obtenerRecibo(reagendarId, usuarioId);

  // Solo se puede reagendar un ticket propio que esté rechazado
  if (recibo === null || recibo.estado !== "rechazado") {
    alert("Ese ticket no se puede reagendar");
    window.location.href = "recibos.html";
    return;
  }

  document.getElementById("tituloAgendar").textContent = "🔁 Reagendar cita";
  document.getElementById("pasosMascotaServicios").hidden = true;
  document.getElementById("datosReagendar").hidden = false;
  document.getElementById("reagendarFolio").textContent = formatoFolio(recibo.id);
  document.getElementById("reagendarMascota").textContent = recibo.mascota + " (" + recibo.especie + ")";
  document.getElementById("reagendarServicios").textContent = recibo.servicios;
  document.getElementById("reagendarMotivo").textContent = recibo.motivo_rechazo;
  document.getElementById("paso3").textContent = "Nueva fecha y hora";
  btnConfirmar.textContent = "Confirmar nueva fecha";
}

// Guarda el día y la hora nuevos del ticket rechazado
async function confirmarReagendar() {
  if (horarioElegido === "") {
    alert("Por favor selecciona un horario disponible");
    return;
  }

  const listo = await reagendarCita(reagendarId, usuarioId, fechaElegida, horarioElegido);

  if (!listo) {
    alert("Ese horario se acaba de ocupar. Elige otro, por favor.");
    horarioElegido = "";
    cargarHorarios();
    return;
  }

  // "reagendada=1" le avisa al recibo que la cita se acaba de reagendar
  window.location.href = "recibo.html?id=" + reagendarId + "&reagendada=1";
}

// ============================================
// CONFIRMAR CITA
// ============================================

btnConfirmar.addEventListener("click", async function () {
  // Al reagendar no hay mascota ni servicios que revisar
  if (reagendarId > 0) {
    confirmarReagendar();
    return;
  }

  const mascotaId = listaMascotas.value;

  // Juntamos los nombres de los servicios marcados
  const servicios = [];
  for (const casilla of casillasServicio) {
    if (casilla.checked) {
      servicios.push(casilla.value);
    }
  }

  // ----- Validaciones -----
  if (mascotaId === "") {
    alert("Seleccione una mascota");
    return;
  }
  if (servicios.length === 0) {
    alert("Seleccione al menos un servicio veterinario");
    return;
  }
  if (horarioElegido === "") {
    alert("Por favor selecciona un horario disponible");
    return;
  }

  // ----- Guardar la cita en la base de datos -----
  // .join(", ") une la lista en un texto: "Consulta General, Vacunación"
  const reciboId = await crearCita(
    usuarioId,
    mascotaId,
    servicios.join(", "),
    calcularTotal(),
    fechaElegida,
    horarioElegido
  );

  if (reciboId === null) {
    alert("Ese horario se acaba de ocupar. Elige otro, por favor.");
    horarioElegido = "";
    cargarHorarios();
    return;
  }

  // Abrimos el recibo nuevo. "nueva=1" le avisa que es una cita recién agendada.
  window.location.href = "recibo.html?id=" + reciboId + "&nueva=1";
});

// ============================================
// AL ABRIR LA PÁGINA
// ============================================
if (reagendarId > 0) {
  prepararReagendar();
} else {
  cargarMascotas();
}
dibujarCalendario();
cargarHorarios();
