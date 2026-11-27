// PANTALLA: MIS RECIBOS

// Agrega una celda (<td>) con un texto a un renglón de la tabla
function agregarCelda(renglon, texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  renglon.appendChild(celda);
  return celda;
}

async function cargarRecibos() {
  const recibos = await obtenerRecibos(usuarioId);

  if (recibos.length === 0) {
    // Sin recibos: escondemos la tabla y mostramos el aviso
    document.getElementById("contenedorTabla").hidden = true;
    document.getElementById("sinRecibos").hidden = false;
    return;
  }

  const cuerpoTabla = document.getElementById("cuerpoTabla");

  // Por cada recibo creamos un renglón (<tr>) en la tabla
  for (const recibo of recibos) {
    const renglon = document.createElement("tr");

    // "celda-larga": ese texto sí puede ocupar varios renglones (ver estilos.css)
    agregarCelda(renglon, formatoFolio(recibo.id));
    agregarCelda(renglon, formatoFecha(recibo.fecha_cita)).className = "celda-larga";
    agregarCelda(renglon, recibo.horario);
    agregarCelda(renglon, recibo.mascota);
    agregarCelda(renglon, recibo.servicios).className = "celda-larga";
    agregarCelda(renglon, formatoDinero(recibo.total));
    agregarCelda(renglon, textoEstado(recibo.estado));

    // Última celda: enlace para ver el recibo completo
    const enlace = document.createElement("a");
    enlace.href = "recibo.html?id=" + recibo.id;
    enlace.textContent = "Ver";
    const ultimaCelda = agregarCelda(renglon, "");
    ultimaCelda.appendChild(enlace);

    // Si un empleado lo rechazó, agregamos el enlace para reagendarlo
    if (recibo.estado === "rechazado") {
      const reagendar = document.createElement("a");
      reagendar.href = "agendar.html?reagendar=" + recibo.id;
      reagendar.textContent = "Reagendar";
      ultimaCelda.appendChild(document.createTextNode(" · "));
      ultimaCelda.appendChild(reagendar);
    }

    cuerpoTabla.appendChild(renglon);
  }
}

cargarRecibos();
