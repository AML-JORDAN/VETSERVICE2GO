// PANTALLA: INICIAR SESIÓN

// 1. Buscamos en el HTML los elementos que vamos a usar (por su id)
const campoCorreo = document.getElementById("correo");
const campoPassword = document.getElementById("password");
const btnIngresar = document.getElementById("btnIngresar");
const btnIrRegistro = document.getElementById("btnIrRegistro");

// 2. Qué pasa cuando hacen clic en "Iniciar sesión".
// La función es "async" porque espera (await) la respuesta de la base de datos.
btnIngresar.addEventListener("click", async function () {
  // .trim() quita los espacios al inicio y al final
  // .toLowerCase() pasa todo a minúsculas (Ana@Correo.com = ana@correo.com)
  const correo = campoCorreo.value.trim().toLowerCase();
  const password = campoPassword.value.trim();

  // Si algún campo está vacío, avisamos y no seguimos (return)
  if (correo === "") {
    alert("Ingrese su correo");
    campoCorreo.focus(); // pone el cursor en ese campo
    return;
  }
  if (password === "") {
    alert("Ingrese su contraseña");
    campoPassword.focus();
    return;
  }

  // Preguntamos a la base de datos si existe ese usuario (ver basedatos.js)
  const usuario = await buscarUsuario(correo, password);

  if (usuario === null) {
    alert("Correo o contraseña incorrectos");
    return;
  }

  // Guardamos en la sesión quién entró: así las otras pantallas lo saben.
  // sessionStorage se borra solo al cerrar la pestaña.
  sessionStorage.setItem("usuarioId", usuario.id);
  sessionStorage.setItem("usuarioNombre", usuario.nombre);
  sessionStorage.setItem("usuarioRol", usuario.rol);

  alert("¡Bienvenido a VETSERVICE2GO, " + usuario.nombre + "!");

  // Cada tipo de cuenta tiene su propia pantalla
  if (usuario.rol === "admin") {
    window.location.href = "admin.html";
  } else if (usuario.rol === "empleado") {
    window.location.href = "empleado.html";
  } else {
    window.location.href = "panel.html";
  }
});

// 3. Qué pasa cuando hacen clic en "Regístrate aquí"
btnIrRegistro.addEventListener("click", function () {
  window.location.href = "registro.html";
});
