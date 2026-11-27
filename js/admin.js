// PANTALLA DEL SUPER USUARIO: ADMINISTRAR PERSONAS
// Agregar (INSERT), modificar (UPDATE), cambiar el rol (UPDATE) y borrar (DELETE) cuentas.

const tituloFormulario = document.getElementById("tituloFormulario");
const campoNombre = document.getElementById("nombre");
const campoCorreo = document.getElementById("correo");
const etiquetaPassword = document.getElementById("etiquetaPassword");
const campoPassword = document.getElementById("password");
const campoRol = document.getElementById("rol");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");

// null = el formulario está agregando a alguien nuevo.
// Un número = el id de la persona que se está modificando.
let idEnEdicion = null;

// "empleado" -> "🩺 Empleado"
function textoRol(rol) {
  if (rol === "admin") return "🛡️ Super usuario";
  if (rol === "empleado") return "🩺 Empleado";
  return "👤 Cliente";
}

// Agrega una celda (<td>) con un texto a un renglón de la tabla
function agregarCelda(renglon, texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  renglon.appendChild(celda);
  return celda;
}

// Crea un botón con su texto y su clase de CSS
function crearBoton(texto, clase) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = clase;
  boton.textContent = texto;
  return boton;
}

// ============================================
// LA TABLA DE PERSONAS
// ============================================

async function cargarUsuarios() {
  const usuarios = await obtenerUsuarios();
  const cuerpoTabla = document.getElementById("cuerpoTabla");
  cuerpoTabla.innerHTML = ""; // borramos los renglones que había

  for (const usuario of usuarios) {
    const renglon = document.createElement("tr");

    agregarCelda(renglon, usuario.nombre);
    agregarCelda(renglon, usuario.correo);
    agregarCelda(renglon, textoRol(usuario.rol));
    agregarCelda(renglon, usuario.mascotas);
    agregarCelda(renglon, usuario.recibos);
    const acciones = agregarCelda(renglon, "");
    acciones.className = "acciones";

    if (usuario.rol === "admin") {
      // La cuenta del super usuario no se puede modificar ni borrar
      acciones.textContent = "(tu cuenta)";
    } else {
      acciones.appendChild(crearBotonEditar(usuario));
      acciones.appendChild(crearBotonRol(usuario));
      acciones.appendChild(crearBotonBorrar(usuario));
    }

    cuerpoTabla.appendChild(renglon);
  }

  document.getElementById("totalUsuarios").textContent = usuarios.length;
}

// "Editar": pasa los datos de la persona al formulario
function crearBotonEditar(usuario) {
  const boton = crearBoton("Editar", "boton-chico");
  boton.addEventListener("click", function () {
    idEnEdicion = usuario.id;
    campoNombre.value = usuario.nombre;
    campoCorreo.value = usuario.correo;
    campoPassword.value = "";
    campoRol.value = usuario.rol;

    tituloFormulario.textContent = "✏️ Modificar a " + usuario.nombre;
    etiquetaPassword.textContent = "Nueva contraseña (déjala vacía para no cambiarla)";
    btnGuardar.textContent = "Guardar cambios";
    btnCancelar.hidden = false;
    campoNombre.focus(); // el navegador sube hasta el formulario
  });
  return boton;
}

// "Hacer empleado" o "Hacer cliente": cambia el rol con un clic
function crearBotonRol(usuario) {
  let rolNuevo = "empleado";
  if (usuario.rol === "empleado") {
    rolNuevo = "cliente";
  }

  const boton = crearBoton("Hacer " + rolNuevo, "boton-chico");
  boton.addEventListener("click", async function () {
    if (!confirm("¿Convertir a " + usuario.nombre + " en " + rolNuevo + "?")) {
      return;
    }
    await cambiarRol(usuario.id, rolNuevo);
    cargarUsuarios();
  });
  return boton;
}

// "Borrar": avisa qué más se va a borrar y pide confirmación
function crearBotonBorrar(usuario) {
  const boton = crearBoton("Borrar", "boton-chico boton-borrar");
  boton.addEventListener("click", async function () {
    let mensaje = "¿Borrar la cuenta de " + usuario.nombre + "?";
    if (usuario.mascotas > 0 || usuario.recibos > 0) {
      mensaje = mensaje + " También se borrarán sus mascotas (" + usuario.mascotas +
        ") y sus recibos (" + usuario.recibos + ").";
    }
    mensaje = mensaje + " Esto no se puede deshacer.";

    if (!confirm(mensaje)) {
      return;
    }

    await borrarUsuario(usuario.id);

    // Si justo la estábamos modificando, dejamos el formulario vacío
    if (idEnEdicion === usuario.id) {
      limpiarFormulario();
    }
    cargarUsuarios();
  });
  return boton;
}

// ============================================
// EL FORMULARIO (agregar o modificar)
// ============================================

// Regresa el formulario a "Agregar persona"
function limpiarFormulario() {
  idEnEdicion = null;
  campoNombre.value = "";
  campoCorreo.value = "";
  campoPassword.value = "";
  campoRol.value = "cliente";

  tituloFormulario.textContent = "➕ Agregar persona";
  etiquetaPassword.textContent = "Contraseña";
  btnGuardar.textContent = "Agregar persona";
  btnCancelar.hidden = true;
}

btnGuardar.addEventListener("click", async function () {
  const nombre = campoNombre.value.trim();
  const correo = campoCorreo.value.trim().toLowerCase();
  const password = campoPassword.value.trim();
  const rol = campoRol.value;

  if (nombre === "" || correo === "") {
    alert("Escribe el nombre y el correo");
    return;
  }
  if (!correo.includes("@")) {
    alert("Escribe un correo válido");
    campoCorreo.focus();
    return;
  }

  if (idEnEdicion === null) {
    // ----- Agregar -----
    if (password === "") {
      alert("Escribe una contraseña");
      campoPassword.focus();
      return;
    }
    const seCreo = await agregarUsuario(nombre, correo, password, rol);
    if (!seCreo) {
      alert("Ya existe una cuenta con ese correo");
      campoCorreo.focus();
      return;
    }
    alert(nombre + " se agregó como " + rol);
  } else {
    // ----- Modificar -----
    const seGuardo = await modificarUsuario(idEnEdicion, nombre, correo, password, rol);
    if (!seGuardo) {
      alert("Ese correo ya lo usa otra cuenta");
      campoCorreo.focus();
      return;
    }
    alert("Se guardaron los cambios de " + nombre);
  }

  limpiarFormulario();
  cargarUsuarios();
});

btnCancelar.addEventListener("click", limpiarFormulario);

// Al abrir la página
cargarUsuarios();
