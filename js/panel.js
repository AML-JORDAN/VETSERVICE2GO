// PANTALLA: MI PANEL
// Muestra las mascotas, las próximas citas y las citas rechazadas del usuario.

async function cargarPanel() {
  // 1. Pedimos los datos a la base de datos (ver basedatos.js)
  const hoy = fechaComoTexto(new Date());
  const mascotas = await obtenerMascotas(usuarioId);
  const citas = await obtenerProximasCitas(usuarioId, hoy);
  const rechazadas = await obtenerCitasRechazadas(usuarioId);

  // 2. Mis mascotas
  document.getElementById("totalMascotas").textContent = mascotas.length;
  const listaMascotas = document.getElementById("listaMascotas");

  for (const mascota of mascotas) {
    const renglon = document.createElement("li");

    if (mascota.foto) {
      // Tiene foto: la mostramos chiquita y redonda
      const foto = document.createElement("img");
      foto.className = "foto-mini";
      foto.src = mascota.foto;
      foto.alt = "Foto de " + mascota.nombre;
      renglon.appendChild(foto);
    } else {
      // No tiene foto: mostramos un dibujito según la especie
      const emoji = document.createElement("span");
      emoji.className = "emoji-mini";
      emoji.textContent = emojiDeEspecie(mascota.especie);
      renglon.appendChild(emoji);
    }

    let texto = mascota.nombre + " · " + mascota.especie;
    if (mascota.raza) {
      texto = texto + ", " + mascota.raza;
    }
    texto = texto + " · " + mascota.peso + " kg";

    const datos = document.createElement("span");
    datos.textContent = texto;
    renglon.appendChild(datos);

    listaMascotas.appendChild(renglon);
  }
  // Si no hay mascotas, mostramos el mensaje de "Aún no has registrado..."
  document.getElementById("sinMascotas").hidden = mascotas.length > 0;

  // 3. Próximas citas: cada una es un enlace a su recibo
  const listaCitas = document.getElementById("listaCitas");

  for (const cita of citas) {
    const renglon = document.createElement("li");
    const enlace = document.createElement("a");
    enlace.href = "recibo.html?id=" + cita.id;
    enlace.textContent = "📅 " + formatoFecha(cita.fecha_cita) + " · " + cita.horario + " · " + cita.mascota;
    renglon.appendChild(enlace);
    listaCitas.appendChild(renglon);
  }
  document.getElementById("sinCitas").hidden = citas.length > 0;

  // 4. Citas rechazadas: cada una con su motivo y un enlace para reagendarla
  const listaRechazadas = document.getElementById("listaRechazadas");

  for (const cita of rechazadas) {
    const renglon = document.createElement("li");

    const datos = document.createElement("span");
    datos.textContent = formatoFolio(cita.id) + " · " + cita.mascota + " · " +
      formatoFecha(cita.fecha_cita) + " · " + cita.horario + ". Motivo: " + cita.motivo_rechazo;
    renglon.appendChild(datos);

    const enlace = document.createElement("a");
    enlace.className = "enlace-reagendar";
    enlace.href = "agendar.html?reagendar=" + cita.id;
    enlace.textContent = "Reagendar →";
    renglon.appendChild(enlace);

    listaRechazadas.appendChild(renglon);
  }
  // El aviso solo se ve si hay al menos una cita rechazada
  document.getElementById("porReagendar").hidden = rechazadas.length === 0;
}

cargarPanel();
