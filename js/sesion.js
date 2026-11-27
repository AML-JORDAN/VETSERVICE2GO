// SESIÓN: este archivo se usa en todas las pantallas que necesitan
// haber iniciado sesión.
//
// Cada página dice para quién es en su etiqueta <body>:
//   <body data-rol="cliente">   panel, mascota, agendar, recibos y recibo
//   <body data-rol="empleado">  empleado
//   <body data-rol="admin">     admin (el super usuario)

// Leemos quién inició sesión (lo guardó login.js)
// (el id es un texto que inventa Firebase, por ejemplo "Xk3s9aQ1...")
const usuarioId = sessionStorage.getItem("usuarioId");
const usuarioNombre = sessionStorage.getItem("usuarioNombre");
const usuarioRol = sessionStorage.getItem("usuarioRol");

// Para quién es esta página
const rolDeLaPagina = document.body.dataset.rol;

if (usuarioNombre === null || usuarioRol === null) {
  // Nadie ha iniciado sesión: lo mandamos a la pantalla de login
  window.location.href = "login.html";
} else if (usuarioRol !== rolDeLaPagina) {
  // Entró a una página que no es para su tipo de cuenta: lo mandamos a la suya
  if (usuarioRol === "admin") {
    window.location.href = "admin.html";
  } else if (usuarioRol === "empleado") {
    window.location.href = "empleado.html";
  } else {
    window.location.href = "panel.html";
  }
} else {
  // Todo bien: mostramos el saludo en la barra de arriba
  document.getElementById("nombreUsuario").textContent = usuarioNombre;
}

// Botón "Cerrar sesión": borramos la sesión y volvemos al inicio
document.getElementById("btnCerrarSesion").addEventListener("click", function () {
  sessionStorage.clear();
  window.location.href = "index.html";
});
