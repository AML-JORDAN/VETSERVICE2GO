// PANTALLA DEL EMPLEADO: TICKETS PAGADOS
// Muestra los tickets de todos los clientes y deja marcarlos como completados o rechazarlos.

const hoy = fechaComoTexto(new Date());

// Agrega un renglón de texto (<p>) a una tarjeta
function agregarLinea(tarjeta, texto, clase) {
  const parrafo = document.createElement("p");
  parrafo.className = clase || "ticket-linea";
  parrafo.textContent = texto;
  tarjeta.appendChild(parrafo);
}

// Crea un botón con su texto y su clase de CSS
function crearBoton(texto, clase) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = clase;
  boton.textContent = texto;
  return boton;
}

// Crea la tarjeta de un ticket con todos sus datos
function crearTarjeta(ticket) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta ticket";

  // ----- Encabezado: foto de la mascota + folio (+ etiqueta "HOY") -----
  const cabecera = document.createElement("div");
  cabecera.className = "ticket-cabecera";

  if (ticket.foto) {
    const foto = document.createElement("img");
    foto.className = "foto-mini";
    foto.src = ticket.foto;
    foto.alt = "Foto de " + ticket.mascota;
    cabecera.appendChild(foto);
  } else {
    const emoji = document.createElement("span");
    emoji.className = "emoji-mini";
    emoji.textContent = emojiDeEspecie(ticket.especie);
    cabecera.appendChild(emoji);
  }

  const folio = document.createElement("strong");
  folio.textContent = "Ticket " + formatoFolio(ticket.id);
  cabecera.appendChild(folio);

  if (ticket.estado === "pagado" && ticket.fecha_cita === hoy) {
    const etiquetaHoy = document.createElement("span");
    etiquetaHoy.className = "etiqueta-hoy";
    etiquetaHoy.textContent = "HOY";
    cabecera.appendChild(etiquetaHoy);
  }

  tarjeta.appendChild(cabecera);

  // ----- Datos del ticket -----
  let mascota = ticket.mascota + " (" + ticket.especie;
  if (ticket.raza) {
    mascota = mascota + ", " + ticket.raza;
  }
  mascota = mascota + ") · " + ticket.peso + " kg";

  agregarLinea(tarjeta, "📅 " + formatoFecha(ticket.fecha_cita) + " · " + ticket.horario);
  agregarLinea(tarjeta, "👤 Cliente: " + ticket.cliente);
  agregarLinea(tarjeta, "🐾 Mascota: " + mascota);
  agregarLinea(tarjeta, "🩺 Servicios: " + ticket.servicios);
  agregarLinea(tarjeta, "💳 Total pagado: " + formatoDinero(ticket.total));

  // ----- Botones o aviso, según el estado -----
  if (ticket.estado === "pagado") {
    const botones = document.createElement("div");
    botones.className = "ticket-botones";

    const botonCompletar = crearBoton("Marcar como completado", "boton");
    const botonRechazar = crearBoton("Rechazar", "boton boton-rechazar");

    botonCompletar.addEventListener("click", async function () {
      // confirm() muestra un aviso con "Aceptar" y "Cancelar"
      const seguro = confirm("¿Ya diste el servicio del ticket " + formatoFolio(ticket.id) + " (" + ticket.mascota + ")?");
      if (!seguro) {
        return;
      }

      // Guardamos en la base de datos quién lo completó (ver basedatos.js)
      // usuarioNombre viene de sesion.js
      await completarTicket(ticket.id, usuarioNombre);

      // Volvemos a dibujar las listas: el ticket pasa a "Completados"
      cargarTickets();
    });

    botonRechazar.addEventListener("click", async function () {
      // prompt() muestra un aviso con una caja de texto.
      // Regresa lo que se escribió, o null si se presionó "Cancelar".
      const motivo = prompt("¿Por qué rechazas el ticket " + formatoFolio(ticket.id) + " (" + ticket.mascota + ")? El cliente lo verá y tendrá que reagendar.");
      if (motivo === null) {
        return;
      }
      // .trim() quita los espacios de los lados: "   " se vuelve ""
      if (motivo.trim() === "") {
        alert("Escribe el motivo para que el cliente sepa por qué se rechazó.");
        return;
      }

      await rechazarTicket(ticket.id, usuarioNombre, motivo.trim());

      // El ticket pasa a "Rechazados"
      cargarTickets();
    });

    botones.appendChild(botonCompletar);
    botones.appendChild(botonRechazar);
    tarjeta.appendChild(botones);
  } else if (ticket.estado === "completado") {
    agregarLinea(tarjeta, "✅ Completado por " + ticket.atendido_por + " el " + ticket.completado_en, "ticket-hecho");
  } else {
    agregarLinea(tarjeta, "❌ Rechazado por " + ticket.atendido_por + ". Motivo: " + ticket.motivo_rechazo, "ticket-rechazado");
    agregarLinea(tarjeta, "⏳ Esperando a que el cliente lo reagende");
  }

  return tarjeta;
}

// Pone las tarjetas de una lista de tickets dentro del HTML
function mostrarLista(tickets, idLista, idTotal, idVacio) {
  const lista = document.getElementById(idLista);
  lista.innerHTML = ""; // borramos lo que había

  for (const ticket of tickets) {
    lista.appendChild(crearTarjeta(ticket));
  }

  document.getElementById(idTotal).textContent = tickets.length;
  document.getElementById(idVacio).hidden = tickets.length > 0;
}

// Pide los tickets a la base de datos y los muestra
async function cargarTickets() {
  const pendientes = await obtenerTickets("pagado");
  const completados = await obtenerTickets("completado");
  const rechazados = await obtenerTickets("rechazado");

  // Los pendientes van del más cercano al más lejano;
  // los demás al revés (.reverse()), para ver primero los más recientes.
  mostrarLista(pendientes, "listaPendientes", "totalPendientes", "sinPendientes");
  mostrarLista(completados.reverse(), "listaCompletados", "totalCompletados", "sinCompletados");
  mostrarLista(rechazados.reverse(), "listaRechazados", "totalRechazados", "sinRechazados");
}

cargarTickets();
