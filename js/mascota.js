// PANTALLA: REGISTRAR MASCOTA

const campoFoto = document.getElementById("foto");
const vistaPrevia = document.getElementById("vistaPrevia");
const campoNombre = document.getElementById("nombreMascota");
const listaEspecie = document.getElementById("especie");
const campoRaza = document.getElementById("raza");
const campoPeso = document.getElementById("peso");
const btnGuardar = document.getElementById("btnGuardar");

// Aquí guardamos la foto ya reducida (empieza vacía porque la foto es opcional)
let fotoReducida = "";

// ----- Foto de la mascota -----
// Cuando el usuario elige una imagen, la hacemos pequeña (160 x 160)
// para que la foto pese poco en la base de datos.
campoFoto.addEventListener("change", function () {
  const archivo = campoFoto.files[0];
  if (!archivo) {
    return;
  }

  const imagen = new Image();

  imagen.onload = function () {
    // Un "canvas" es un lienzo donde podemos dibujar
    const lienzo = document.createElement("canvas");
    lienzo.width = 160;
    lienzo.height = 160;

    // Tomamos el cuadrado del centro de la foto y lo dibujamos en el lienzo
    const lado = Math.min(imagen.width, imagen.height);
    const x = (imagen.width - lado) / 2;
    const y = (imagen.height - lado) / 2;
    lienzo.getContext("2d").drawImage(imagen, x, y, lado, lado, 0, 0, 160, 160);

    // Convertimos el dibujo en texto ("data:image/jpeg;base64,...")
    fotoReducida = lienzo.toDataURL("image/jpeg", 0.7);
    vistaPrevia.src = fotoReducida;
  };

  imagen.onerror = function () {
    alert("No se pudo abrir esa imagen. Prueba con una foto JPG o PNG.");
  };

  // URL.createObjectURL crea una dirección temporal para leer el archivo
  imagen.src = URL.createObjectURL(archivo);
});

// ----- Guardar -----
btnGuardar.addEventListener("click", async function () {
  const nombre = campoNombre.value.trim();
  const especie = listaEspecie.value;
  const raza = campoRaza.value.trim();
  const pesoTexto = campoPeso.value.trim();

  // ----- Validaciones -----
  if (nombre === "") {
    alert("Ingrese el nombre de la mascota");
    campoNombre.focus();
    return;
  }
  if (especie === "") {
    alert("Seleccione una especie válida");
    return;
  }
  if (pesoTexto === "") {
    alert("Ingrese el peso");
    campoPeso.focus();
    return;
  }

  // Convertimos el texto del peso a número
  const peso = Number(pesoTexto);

  if (peso <= 0) {
    alert("El peso debe ser mayor a 0");
    campoPeso.focus();
    return;
  }

  // ----- Guardar en la base de datos (ver basedatos.js) -----
  // usuarioId viene de sesion.js: la mascota queda a nombre de quien inició sesión
  await registrarMascota(usuarioId, nombre, especie, raza, peso, fotoReducida);

  alert("¡" + nombre + " quedó registrado!");
  window.location.href = "panel.html";
});
