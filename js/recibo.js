// PANTALLA: RECIBO DE LA CITA

// El número del recibo viene en la dirección: recibo.html?id=5
// Si además trae "nueva=1", la cita se acaba de agendar,
// y si trae "reagendada=1", se acaba de reagendar.
const datos = new URLSearchParams(window.location.search);
const reciboId = Number(datos.get("id"));
const esNueva = datos.get("nueva") === "1";
const esReagendada = datos.get("reagendada") === "1";

async function mostrarRecibo() {
  const recibo = await obtenerRecibo(reciboId, usuarioId);

  if (recibo === null) {
    alert("No se encontró ese recibo");
    window.location.href = "recibos.html";
    return;
  }

  // Título: igual que en la app cuando la cita es nueva
  if (esNueva) {
    document.getElementById("titulo").textContent = "¡Cita Agendada con Éxito!";
    document.getElementById("subtitulo").textContent = "Resumen de los detalles de tu servicio veterinario";
  } else if (esReagendada) {
    document.getElementById("titulo").textContent = "¡Cita Reagendada!";
    document.getElementById("subtitulo").textContent = "Tu ticket ya tiene nueva fecha y hora";
  } else {
    document.getElementById("titulo").textContent = "Recibo " + formatoFolio(recibo.id);
    document.getElementById("subtitulo").textContent = "Detalles de tu cita";
  }

  // Foto de la mascota (si tiene)
  if (recibo.foto) {
    const foto = document.getElementById("fotoMascota");
    foto.src = recibo.foto;
    foto.hidden = false;
  }

  // Mascota con su especie y raza: "Firulais (Perro, Labrador)"
  let mascota = recibo.mascota + " (" + recibo.especie;
  if (recibo.raza) {
    mascota = mascota + ", " + recibo.raza;
  }
  mascota = mascota + ")";

  // Escribimos los datos dentro de los <span> del HTML
  document.getElementById("folio").textContent = formatoFolio(recibo.id);
  document.getElementById("cliente").textContent = usuarioNombre;
  document.getElementById("mascota").textContent = mascota;
  document.getElementById("peso").textContent = recibo.peso;
  document.getElementById("fecha").textContent = formatoFecha(recibo.fecha_cita);
  document.getElementById("horario").textContent = recibo.horario;
  document.getElementById("total").textContent = formatoDinero(recibo.total);
  document.getElementById("creado").textContent = recibo.creado;

  // Estado: si ya se dio el servicio, decimos quién lo atendió y cuándo;
  // si se rechazó, quién lo rechazó y por qué
  let estado = textoEstado(recibo.estado);
  if (recibo.estado === "completado") {
    estado = estado + " por " + recibo.atendido_por + " el " + recibo.completado_en;
  } else if (recibo.estado === "rechazado") {
    estado = estado + " por " + recibo.atendido_por + ". Motivo: " + recibo.motivo_rechazo;

    // Un ticket rechazado se tiene que reagendar: mostramos el botón
    const btnReagendar = document.getElementById("btnReagendar");
    btnReagendar.href = "agendar.html?reagendar=" + recibo.id;
    btnReagendar.hidden = false;
  } else {
    estado = estado + " (pendiente de atender)";
  }
  document.getElementById("estado").textContent = estado;

  // Los servicios vienen juntos ("Consulta General, Vacunación"):
  // .split(", ") los separa en una lista y hacemos un <li> por cada uno
  const listaServicios = document.getElementById("listaServicios");
  for (const servicio of recibo.servicios.split(", ")) {
    const elemento = document.createElement("li");
    elemento.textContent = servicio;
    listaServicios.appendChild(elemento);
  }
}

mostrarRecibo();

// window.print() abre la ventana para imprimir (o guardar como PDF)
document.getElementById("btnImprimir").addEventListener("click", function () {
  window.print();
});
