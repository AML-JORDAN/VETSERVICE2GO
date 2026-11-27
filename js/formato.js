// FORMATO: funciones para mostrar los datos de forma bonita.
// Se usan en las pantallas privadas (panel, agendar, recibos y recibo).

// Una fecha de JavaScript -> texto "2026-11-13" (año-mes-día).
// En este formato las fechas se pueden comparar y ordenar como texto.
function fechaComoTexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // los meses empiezan en 0
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// "2026-11-13" -> "jueves, 13 de noviembre de 2026"
function formatoFecha(texto) {
  const partes = texto.split("-");
  const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// 5 -> "#0005"
function formatoFolio(id) {
  return "#" + String(id).padStart(4, "0");
}

// 750 -> "$750.00 MXN"
function formatoDinero(cantidad) {
  return "$" + cantidad.toFixed(2) + " MXN";
}

// Estado del ticket: "pagado" -> "💳 Pagado", "completado" -> "✅ Completado",
// "rechazado" -> "❌ Rechazado"
function textoEstado(estado) {
  if (estado === "completado") return "✅ Completado";
  if (estado === "rechazado") return "❌ Rechazado";
  return "💳 Pagado";
}

// Un dibujito para cada especie (cuando la mascota no tiene foto)
function emojiDeEspecie(especie) {
  if (especie === "Perro") return "🐶";
  if (especie === "Gato") return "🐱";
  if (especie === "Ave") return "🐦";
  if (especie === "Conejo") return "🐰";
  return "🐾";
}
