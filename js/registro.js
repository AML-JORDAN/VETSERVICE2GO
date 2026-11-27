// PANTALLA: CREAR CUENTA

const campoNombre = document.getElementById("nombre");
const campoCorreo = document.getElementById("correo");
const campoPassword = document.getElementById("password");
const btnRegistrarse = document.getElementById("btnRegistrarse");
const btnVolver = document.getElementById("btnVolver");

btnRegistrarse.addEventListener("click", async function () {
  const nombre = campoNombre.value.trim();
  const correo = campoCorreo.value.trim().toLowerCase();
  const password = campoPassword.value.trim();

  // || significa "o": si CUALQUIERA de los tres está vacío
  if (nombre === "" || correo === "" || password === "") {
    alert("Completa todos los campos");
    return;
  }

  // Revisión sencilla: un correo siempre lleva @
  if (!correo.includes("@")) {
    alert("Escribe un correo válido");
    campoCorreo.focus();
    return;
  }

  // Guardamos el usuario en la base de datos (ver basedatos.js)
  const seCreo = await registrarUsuario(nombre, correo, password);

  if (!seCreo) {
    alert("Ya existe una cuenta con ese correo");
    campoCorreo.focus();
    return;
  }

  alert("¡Cuenta creada exitosamente! Ahora inicia sesión.");
  window.location.href = "login.html";
});

btnVolver.addEventListener("click", function () {
  window.location.href = "login.html";
});
