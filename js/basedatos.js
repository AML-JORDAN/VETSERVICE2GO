// ============================================
// BASE DE DATOS (Firebase Cloud Firestore)
//
// La página web y la app de Android usan la MISMA base de datos, que vive en
// internet, en Firebase. Por eso una cita que se agenda desde la app la ve
// el empleado en la página web, y al revés.
//
// Firestore no tiene tablas sino "colecciones" de "documentos".
// Un documento es como un renglón de una tabla: tiene un id y sus datos ("campos").
//
// Colecciones:
//   usuarios  (nombre, correo, password, rol)
//   mascotas  (usuario_id, nombre, especie, raza, peso, foto)
//   citas     Cada cita es un recibo (un "ticket"). Su id es el folio: 1, 2, 3...
//             (usuario_id, cliente, propietario, mascota_id, mascota, especie, raza,
//              peso, foto, servicios, total, fecha_cita, horario, creado,
//              estado, atendido_por, completado_en, motivo_rechazo)
//   horarios  Un documento por cada horario ocupado. Su id es el día y la hora
//             ("2026-11-27 15:30 - 16:10"): como no puede haber dos documentos
//             con el mismo id, tampoco puede haber dos citas a la misma hora.
//   config    "folios" (el último folio que se usó) y
//             "cuentas" (si ya se crearon las cuentas iniciales)
//
// En Firestore no hay JOIN. Por eso cada cita guarda una copia de los datos
// de su mascota y el nombre del cliente: así se puede mostrar sin buscar en
// otras colecciones.
//
// Las fechas se guardan como "2026-11-27" (año-mes-día) en la web y en la app.
// ============================================

// Datos del proyecto de Firebase (salen de la consola de Firebase).
// No son una contraseña: cualquier página que use Firebase los lleva así.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBAr0q8O_hTvAV3iqSVBPbrR0YVo5BwzI0",
  authDomain: "vetservice2go.firebaseapp.com",
  projectId: "vetservice2go",
  storageBucket: "vetservice2go.firebasestorage.app",
  messagingSenderId: "913020484601",
  appId: "1:913020484601:web:c1e427955ec60e5c8f5b28",
  measurementId: "G-Z4S6TJD7NT"
};

// De aquí se descargan las funciones de Firebase (versión 13.2.0)
const FIREBASE_URL = "https://www.gstatic.com/firebasejs/13.2.0/";

// Cuentas que se crean solas la primera vez que se abre la base de datos:
// el super usuario, los empleados de la veterinaria y algunos clientes.
// Todas usan PASSWORD_INICIAL, menos la que trae su propia contraseña.
const CUENTAS_INICIALES = [
  { nombre: "Super Usuario", correo: "super.usuario@gmail.com", rol: "admin" },
  { nombre: "Empleado de Turno", correo: "empleado@vetservice2go.com", rol: "empleado", password: "VET2026" },
  { nombre: "Jordan Martinez", correo: "jordan.martinez@gmail.com", rol: "empleado" },
  { nombre: "Angel Estrada", correo: "angel.estrada@gmail.com", rol: "empleado" },
  { nombre: "Diego Olachea", correo: "diego.olachea@gmail.com", rol: "empleado" },
  { nombre: "Selene Degadillo", correo: "selene.degadillo@gmail.com", rol: "empleado" },
  { nombre: "María García", correo: "maria.garcia@gmail.com", rol: "cliente" },
  { nombre: "Luis Hernández", correo: "luis.hernandez@gmail.com", rol: "cliente" },
  { nombre: "Sofía Ramírez", correo: "sofia.ramirez@gmail.com", rol: "cliente" },
  { nombre: "Carlos Torres", correo: "carlos.torres@gmail.com", rol: "cliente" }
];
const PASSWORD_INICIAL = "1234567";

// Número de la lista de cuentas iniciales. Si algún día se agregan cuentas a la
// lista, se sube este número para que se creen las que falten.
const VERSION_CUENTAS = 1;

// Estados de una cita:
//   "pagado"     se acaba de agendar y espera a que un empleado la atienda
//   "completado" el empleado ya dio el servicio
//   "rechazado"  el empleado no la pudo atender; el cliente la tiene que reagendar
const ESTADO_PAGADO = "pagado";
const ESTADO_COMPLETADO = "completado";
const ESTADO_RECHAZADO = "rechazado";

let baseDeDatos = null; // la conexión con Firestore
let fs = null;          // las funciones de Firestore (collection, getDocs, addDoc...)
let conexion = null;    // la promesa de abrirBaseDeDatos (ver abajo)

// Si algo falla al hablar con Firebase (por ejemplo, no hay internet), avisamos.
// "unhandledrejection" ocurre cuando una función async falla y nadie atrapó el error.
window.addEventListener("unhandledrejection", function (evento) {
  console.error(evento.reason);
  alert("No se pudo conectar con la base de datos. Revisa tu conexión a internet y vuelve a intentarlo.");
});

// Abre la conexión con Firestore. Se conecta UNA sola vez por página:
// si varias partes de la página la piden al mismo tiempo, todas esperan la misma conexión.
function abrirBaseDeDatos() {
  if (conexion === null) {
    conexion = conectar();
  }
  return conexion;
}

async function conectar() {
  // import() descarga las funciones de Firebase desde internet
  const firebaseApp = await import(FIREBASE_URL + "firebase-app.js");
  fs = await import(FIREBASE_URL + "firebase-firestore.js");

  const app = firebaseApp.initializeApp(FIREBASE_CONFIG);
  baseDeDatos = fs.getFirestore(app);

  await crearCuentasIniciales();
  return baseDeDatos;
}

// ============================================
// AYUDANTES (las usan las funciones de abajo, ya con la base de datos abierta)
// ============================================

function coleccion(nombre) {
  return fs.collection(baseDeDatos, nombre);
}

// Un documento por su id. String() porque Firestore pide el id como texto.
function documento(nombreColeccion, id) {
  return fs.doc(baseDeDatos, nombreColeccion, String(id));
}

// Convierte un documento de Firestore en un objeto normal: { id: "...", nombre: "...", ... }
function comoObjeto(doc) {
  return { ...doc.data(), id: doc.id };
}

// Lee un documento por su id. Regresa null si no existe.
async function leerUno(nombreColeccion, id) {
  const doc = await fs.getDoc(documento(nombreColeccion, id));
  if (!doc.exists()) {
    return null;
  }
  return comoObjeto(doc);
}

// Lee todos los documentos de una colección
async function leerTodos(nombreColeccion) {
  const resultado = await fs.getDocs(coleccion(nombreColeccion));
  return resultado.docs.map(comoObjeto);
}

// Busca los documentos donde un campo vale cierto valor (como WHERE campo = valor)
async function buscarDonde(nombreColeccion, campo, valor) {
  const consulta = fs.query(coleccion(nombreColeccion), fs.where(campo, "==", valor));
  const resultado = await fs.getDocs(consulta);
  return resultado.docs.map(comoObjeto);
}

// Ordena citas por día y hora, la más cercana primero
function ordenarPorFecha(citas) {
  return citas.sort(function (a, b) {
    return (a.fecha_cita + a.horario).localeCompare(b.fecha_cita + b.horario);
  });
}

// Ordena citas por folio (1, 2, 3...). Number() porque el id es texto ("10" va después de "9").
function ordenarPorFolio(citas) {
  return citas.sort(function (a, b) {
    return Number(a.id) - Number(b.id);
  });
}

// El id del documento que aparta un horario: "2026-11-27 15:30 - 16:10"
function idDeHorario(fechaCita, horario) {
  return fechaCita + " " + horario;
}

// La contraseña no se guarda tal cual: se guarda su "huella" SHA-256,
// un texto que sale de la contraseña pero con el que no se puede adivinar.
// Para iniciar sesión se compara la huella de lo que se escribió con la guardada.
// La app de Android calcula la misma huella.
async function cifrar(password) {
  const bytes = new TextEncoder().encode(password);
  const huella = await crypto.subtle.digest("SHA-256", bytes);
  // Cada byte se escribe como 2 letras/números: 255 -> "ff"
  return Array.from(new Uint8Array(huella))
    .map(function (byte) { return byte.toString(16).padStart(2, "0"); })
    .join("");
}

// Crea cada cuenta de CUENTAS_INICIALES que todavía no exista, UNA sola vez.
// El documento config/cuentas recuerda que ya se crearon: así, si el super usuario
// borra una de esas cuentas, no vuelve a aparecer.
async function crearCuentasIniciales() {
  const marca = documento("config", "cuentas");

  // Una "transacción" lee y escribe de un solo golpe: si dos personas abren la
  // página al mismo tiempo, solo a una le toca crear las cuentas.
  const meToca = await fs.runTransaction(baseDeDatos, async function (transaccion) {
    const actual = await transaccion.get(marca);
    const version = actual.exists() ? actual.data().version : 0;
    if (version >= VERSION_CUENTAS) {
      return false; // ya se habían creado
    }
    transaccion.set(marca, { version: VERSION_CUENTAS });
    return true;
  });

  if (!meToca) {
    return;
  }

  for (const cuenta of CUENTAS_INICIALES) {
    const existe = await buscarDonde("usuarios", "correo", cuenta.correo);
    if (existe.length === 0) {
      await fs.addDoc(coleccion("usuarios"), {
        nombre: cuenta.nombre,
        correo: cuenta.correo,
        password: await cifrar(cuenta.password || PASSWORD_INICIAL),
        rol: cuenta.rol
      });
    }
  }
}

// ============================================
// USUARIOS
// ============================================

// Busca un usuario con ese correo y contraseña.
// Regresa el usuario (con su rol) si existe, o null si no.
async function buscarUsuario(correo, password) {
  await abrirBaseDeDatos();
  const encontrados = await buscarDonde("usuarios", "correo", correo);
  if (encontrados.length === 0) {
    return null;
  }

  const usuario = encontrados[0];
  if (usuario.password !== await cifrar(password)) {
    return null;
  }
  return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol };
}

// Guarda una cuenta nueva con el rol que se elija ("cliente" o "empleado").
// Regresa true si se creó, o false si el correo ya estaba registrado.
async function agregarUsuario(nombre, correo, password, rol) {
  await abrirBaseDeDatos();
  const existentes = await buscarDonde("usuarios", "correo", correo);
  if (existentes.length > 0) {
    return false;
  }

  // addDoc agrega un documento nuevo; Firestore le pone un id solo
  await fs.addDoc(coleccion("usuarios"), {
    nombre: nombre,
    correo: correo,
    password: await cifrar(password),
    rol: rol
  });
  return true;
}

// "Crear cuenta" (registro.html): las cuentas que se crean ahí siempre son de cliente
async function registrarUsuario(nombre, correo, password) {
  return await agregarUsuario(nombre, correo, password, "cliente");
}

// ============================================
// MASCOTAS
// ============================================

// Guarda una mascota nueva del usuario.
// La foto es texto (una imagen pequeña en formato "data:image/jpeg;base64,...").
async function registrarMascota(usuarioId, nombre, especie, raza, peso, foto) {
  await abrirBaseDeDatos();
  await fs.addDoc(coleccion("mascotas"), {
    usuario_id: usuarioId,
    nombre: nombre,
    especie: especie,
    raza: raza,
    peso: peso,
    foto: foto
  });
}

// Regresa la lista de mascotas del usuario, ordenadas por nombre
async function obtenerMascotas(usuarioId) {
  await abrirBaseDeDatos();
  const mascotas = await buscarDonde("mascotas", "usuario_id", usuarioId);
  return mascotas.sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre);
  });
}

// ============================================
// CITAS Y RECIBOS (lo que usa el cliente)
// ============================================

// Regresa los horarios que ya están ocupados en un día.
// Ejemplo: ["16:00 - 16:40"]
// Un ticket rechazado sigue ocupando su horario hasta que el cliente lo reagenda.
async function obtenerHorariosOcupados(fechaCita) {
  await abrirBaseDeDatos();
  const ocupados = await buscarDonde("horarios", "fecha_cita", fechaCita);
  return ocupados.map(function (h) { return h.horario; });
}

// Guarda una cita nueva (con su recibo) y regresa su número (folio).
// El recibo empieza con estado "pagado".
// Si ese horario ya estaba ocupado, regresa null.
async function crearCita(usuarioId, mascotaId, servicios, total, fechaCita, horario) {
  await abrirBaseDeDatos();
  const usuario = await leerUno("usuarios", usuarioId);
  const mascota = await leerUno("mascotas", mascotaId);

  const refHorario = documento("horarios", idDeHorario(fechaCita, horario));
  const refFolios = documento("config", "folios");

  // En la misma transacción: revisamos que nadie haya ganado el horario,
  // sacamos el folio que sigue y guardamos la cita.
  return await fs.runTransaction(baseDeDatos, async function (transaccion) {
    const horarioGuardado = await transaccion.get(refHorario);
    if (horarioGuardado.exists()) {
      return null; // alguien lo ocupó
    }

    const folios = await transaccion.get(refFolios);
    const folio = (folios.exists() ? folios.data().ultimo : 0) + 1;

    transaccion.set(refFolios, { ultimo: folio });
    transaccion.set(refHorario, { fecha_cita: fechaCita, horario: horario, cita_id: folio });
    transaccion.set(documento("citas", folio), {
      usuario_id: usuarioId,
      cliente: usuario.nombre,
      propietario: usuario.nombre,
      mascota_id: mascotaId,
      mascota: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza,
      peso: mascota.peso,
      foto: mascota.foto,
      servicios: servicios,
      total: total,
      fecha_cita: fechaCita,
      horario: horario,
      // Fecha y hora en que se generó el recibo, por ejemplo "12/11/2026, 20:30:05"
      creado: new Date().toLocaleString("es-MX"),
      estado: ESTADO_PAGADO,
      atendido_por: null,
      completado_en: null,
      motivo_rechazo: null
    });
    return folio;
  });
}

// Regresa todos los recibos del usuario, del más nuevo al más viejo
async function obtenerRecibos(usuarioId) {
  await abrirBaseDeDatos();
  const recibos = await buscarDonde("citas", "usuario_id", usuarioId);
  return ordenarPorFolio(recibos).reverse();
}

// Regresa las próximas citas del usuario (de hoy en adelante y todavía sin atender),
// la más cercana primero. Como máximo 5 citas.
async function obtenerProximasCitas(usuarioId, hoy) {
  await abrirBaseDeDatos();
  const citas = await buscarDonde("citas", "usuario_id", usuarioId);
  const proximas = citas.filter(function (cita) {
    return cita.fecha_cita >= hoy && cita.estado === ESTADO_PAGADO;
  });
  return ordenarPorFecha(proximas).slice(0, 5);
}

// Regresa los tickets del usuario que un empleado rechazó.
// El usuario los tiene que reagendar (ver reagendarCita).
async function obtenerCitasRechazadas(usuarioId) {
  await abrirBaseDeDatos();
  const citas = await buscarDonde("citas", "usuario_id", usuarioId);
  const rechazadas = citas.filter(function (cita) {
    return cita.estado === ESTADO_RECHAZADO;
  });
  return ordenarPorFolio(rechazadas);
}

// El usuario reagenda un ticket rechazado. Es el MISMO ticket (misma mascota,
// mismos servicios, ya pagado): solo cambia el día y la hora, y vuelve a quedar
// "pagado" para que un empleado lo atienda. Su horario anterior queda libre.
// Regresa false si el horario nuevo ya estaba ocupado.
async function reagendarCita(reciboId, usuarioId, fechaCita, horario) {
  await abrirBaseDeDatos();
  const refCita = documento("citas", reciboId);
  const refNuevo = documento("horarios", idDeHorario(fechaCita, horario));

  return await fs.runTransaction(baseDeDatos, async function (transaccion) {
    const cita = await transaccion.get(refCita);
    const horarioNuevo = await transaccion.get(refNuevo);

    // Solo se reagenda un ticket propio que siga rechazado
    if (!cita.exists() || cita.data().usuario_id !== usuarioId || cita.data().estado !== ESTADO_RECHAZADO) {
      return false;
    }
    if (horarioNuevo.exists()) {
      return false;
    }

    // Liberamos el horario anterior y apartamos el nuevo
    transaccion.delete(documento("horarios", idDeHorario(cita.data().fecha_cita, cita.data().horario)));
    transaccion.set(refNuevo, { fecha_cita: fechaCita, horario: horario, cita_id: Number(reciboId) });

    // null = vacío: borramos quién lo rechazó y por qué, porque el ticket empieza de nuevo
    transaccion.update(refCita, {
      fecha_cita: fechaCita,
      horario: horario,
      estado: ESTADO_PAGADO,
      atendido_por: null,
      motivo_rechazo: null
    });
    return true;
  });
}

// Regresa un recibo con todos sus datos, o null si no existe
// (o si es de otro usuario).
async function obtenerRecibo(reciboId, usuarioId) {
  await abrirBaseDeDatos();
  const recibo = await leerUno("citas", reciboId);
  if (recibo === null || recibo.usuario_id !== usuarioId) {
    return null;
  }
  return recibo;
}

// ============================================
// TICKETS (lo que usa el empleado)
// ============================================

// Regresa los tickets de TODOS los clientes que tienen cierto estado
// ("pagado", "completado" o "rechazado"), del más cercano al más lejano.
async function obtenerTickets(estado) {
  await abrirBaseDeDatos();
  const tickets = await buscarDonde("citas", "estado", estado);
  return ordenarPorFecha(tickets);
}

// Cambia un ticket solo si sigue "pagado" (por si otro empleado lo atendió
// al mismo tiempo desde la página o desde la app)
async function cambiarSiEstaPagado(reciboId, cambios) {
  await abrirBaseDeDatos();
  const refCita = documento("citas", reciboId);
  await fs.runTransaction(baseDeDatos, async function (transaccion) {
    const cita = await transaccion.get(refCita);
    if (cita.exists() && cita.data().estado === ESTADO_PAGADO) {
      transaccion.update(refCita, cambios);
    }
  });
}

// El empleado marca un ticket como completado (guardamos quién y cuándo)
async function completarTicket(reciboId, nombreEmpleado) {
  await cambiarSiEstaPagado(reciboId, {
    estado: ESTADO_COMPLETADO,
    atendido_por: nombreEmpleado,
    completado_en: new Date().toLocaleString("es-MX")
  });
}

// El empleado rechaza un ticket porque no se puede dar el servicio.
// Guardamos quién lo rechazó y el motivo, para que el cliente lo lea y lo reagende.
async function rechazarTicket(reciboId, nombreEmpleado, motivo) {
  await cambiarSiEstaPagado(reciboId, {
    estado: ESTADO_RECHAZADO,
    atendido_por: nombreEmpleado,
    motivo_rechazo: motivo
  });
}

// ============================================
// PERSONAS (lo que usa el super usuario)
// ============================================

// Regresa todas las cuentas, con cuántas mascotas y cuántos recibos tiene cada una
async function obtenerUsuarios() {
  await abrirBaseDeDatos();
  const usuarios = await leerTodos("usuarios");
  const mascotas = await leerTodos("mascotas");
  const citas = await leerTodos("citas");

  const lista = usuarios.map(function (usuario) {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      mascotas: mascotas.filter(function (m) { return m.usuario_id === usuario.id; }).length,
      recibos: citas.filter(function (c) { return c.usuario_id === usuario.id; }).length
    };
  });

  return lista.sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre);
  });
}

// Cambia los datos de una cuenta. Si password viene vacío, se queda la que tenía.
// Regresa false si el correo nuevo ya lo usa OTRA cuenta.
// La cuenta del super usuario no se puede cambiar.
async function modificarUsuario(usuarioId, nombre, correo, password, rol) {
  await abrirBaseDeDatos();

  const conEseCorreo = await buscarDonde("usuarios", "correo", correo);
  for (const otro of conEseCorreo) {
    if (otro.id !== usuarioId) {
      return false;
    }
  }

  const usuario = await leerUno("usuarios", usuarioId);
  if (usuario === null || usuario.rol === "admin") {
    return true;
  }

  const cambios = { nombre: nombre, correo: correo, rol: rol };
  if (password !== "") {
    cambios.password = await cifrar(password);
  }

  // Un "lote" (writeBatch) guarda varios cambios juntos, todos o ninguno.
  // Las citas guardan una copia del nombre del cliente: también la actualizamos.
  const lote = fs.writeBatch(baseDeDatos);
  lote.update(documento("usuarios", usuarioId), cambios);
  const citas = await buscarDonde("citas", "usuario_id", usuarioId);
  for (const cita of citas) {
    lote.update(documento("citas", cita.id), { cliente: nombre });
  }
  await lote.commit();
  return true;
}

// Convierte una cuenta en "cliente" o en "empleado"
async function cambiarRol(usuarioId, rol) {
  await abrirBaseDeDatos();
  const usuario = await leerUno("usuarios", usuarioId);
  if (usuario === null || usuario.rol === "admin") {
    return;
  }
  await fs.updateDoc(documento("usuarios", usuarioId), { rol: rol });
}

// Borra una cuenta junto con sus mascotas, sus citas y los horarios que apartaban.
// El super usuario no se puede borrar.
async function borrarUsuario(usuarioId) {
  await abrirBaseDeDatos();
  const usuario = await leerUno("usuarios", usuarioId);
  if (usuario === null || usuario.rol === "admin") {
    return;
  }

  const citas = await buscarDonde("citas", "usuario_id", usuarioId);
  const mascotas = await buscarDonde("mascotas", "usuario_id", usuarioId);

  const lote = fs.writeBatch(baseDeDatos);
  for (const cita of citas) {
    lote.delete(documento("citas", cita.id));
    lote.delete(documento("horarios", idDeHorario(cita.fecha_cita, cita.horario)));
  }
  for (const mascota of mascotas) {
    lote.delete(documento("mascotas", mascota.id));
  }
  lote.delete(documento("usuarios", usuarioId));
  await lote.commit();
}
