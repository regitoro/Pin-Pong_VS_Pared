const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//estado del juego
const paddle = {
    x:30,
    y:175,
    width:15,
    height:100,
    speed:8,
    dy:0,

};

const ball = {
    x: 400,
    y: 225,
    radius: 10,
    speedX: 6,
    speedY: 6,
};

let score = 0;

// estados del juego: "inicio" -> "bienvenida" -> "jugando"
let estado = "inicio";
let nombreJugador = "";
const DURACION_BIENVENIDA = 2000; // milisegundos que se muestra el mensaje

//captura de eventos del taclado
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "r" || e.key === "R") {
        paddle.dy = -paddle.speed;
    }else if (e.key === "ArrowDown" || e.key === "f" || e.key === "F") {
        paddle.dy = paddle.speed;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key ==="ArrowDown" ||
        e.key === "r" || e.key === "R" || e.key === "f" || e.key === "F") {
        paddle.dy = 0;
    }
});

function entrar(){
    const nombre = document.getElementById("nombre").value;
    if(nombre.trim() === ""){
        alert("Por favor, ingresa tu nombre.");
        return;
    }

    nombreJugador = nombre.trim();
    document.getElementById("PantallaInicio").style.display = "none"; // ocultar pantalla de inicio
    estado = "bienvenida";

    // después de unos segundos comienza el juego
    setTimeout(() => {
        estado = "jugando";
    }, DURACION_BIENVENIDA);
}

// también se puede entrar presionando Enter en el campo del nombre
document.getElementById("nombre").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        entrar();
    }
});

//logica de fisica y colision
function update() {
    // 1. movimiento de la paleta
    paddle.y += paddle.dy;

    //limitar la paleta para que no salga del canvas
    if(paddle.y <0) paddle.y = 0;
    if(paddle.y + paddle.height > canvas.height) paddle.y = canvas.height - paddle.height;

    // 2. movimiento de la pelota
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    //rebote superior e inferior
    if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height){
        ball.speedY *= -1;
    }


    //rebote en la pared derecha (simulando el modo practica)
    if (ball.x + ball.radius > canvas.width - 10) {  // -10 por el grosor de la pared dibujada
    ball.speedX *= -1;
    }


    //3. colision de l apelota con la pared
    if(
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y > paddle.y &&
        ball.y <paddle.y + paddle.height
    ) {
        ball.speedX *= -1;
         //aumentrar ligeramente la veolcidad para dar progresion al juego
         ball.speedX = acelerar(ball.speedX, INCREMENTO_POR_GOLPE);
         ball.x = paddle.x + paddle.width + ball.radius; //evitar que la pelota se quede pegada a la paleta
         score += 10;
         levels();

    }
    if(ball.x < 0){
        perder();
    }
    
}

// cada 50 puntos se sube un nivel, sin límite
const PUNTOS_POR_NIVEL = 50;
const INCREMENTO_PELOTA = 1;
const INCREMENTO_PALETA = 0.5;
const INCREMENTO_POR_GOLPE = 0.2;
// límite por eje; debe ser menor que el ancho de la paleta + el diámetro de la pelota (35px)
// para que la pelota no atraviese la paleta en un solo fotograma
const VELOCIDAD_MAXIMA_PELOTA = 15;
const VELOCIDAD_PALETA_INICIAL = paddle.speed;
let nivelActual = 0;

// suma rapidez sin cambiar la dirección y sin pasar de la velocidad máxima
function acelerar(velocidad, incremento) {
    const rapidez = Math.min(Math.abs(velocidad) + incremento, VELOCIDAD_MAXIMA_PELOTA);
    return Math.sign(velocidad) * rapidez;
}

function aumentarVelocidad() {
    ball.speedX = acelerar(ball.speedX, INCREMENTO_PELOTA);
    ball.speedY = acelerar(ball.speedY, INCREMENTO_PELOTA);
    paddle.speed += INCREMENTO_PALETA;
}

// nivel que ve el jugador (nivelActual empieza en 0, se muestra desde el nivel 1)
function nivelMostrado() {
    return nivelActual + 1;
}

// sube de nivel solo una vez cada vez que el puntaje cruza un múltiplo de 50
function levels() {
    const nuevoNivel = Math.floor(score / PUNTOS_POR_NIVEL);
    while (nivelActual < nuevoNivel) {
        nivelActual++;
        aumentarVelocidad();
    }
}

// Función para reiniciar el estado
function resetGame() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = 6;
    ball.speedY = 6;
    score = 0;
    nivelActual = 0;
    paddle.speed = VELOCIDAD_PALETA_INICIAL;
}

// ---------- tabla de resultados ----------
// los mejores scores se guardan en el localStorage del navegador
const CLAVE_PUNTAJES = "pongVsPared_mejoresPuntajes";
const CANTIDAD_MEJORES = 3;

function cargarMejores() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_PUNTAJES)) || [];
    } catch {
        return []; // si no hay datos o están dañados, empezamos con la lista vacía
    }
}

// agrega la partida, ordena de mayor a menor y conserva solo los 3 mejores
function guardarPuntaje(partida) {
    const mejores = [...cargarMejores(), partida]
        .sort((a, b) => b.score - a.score)
        .slice(0, CANTIDAD_MEJORES);
    try {
        localStorage.setItem(CLAVE_PUNTAJES, JSON.stringify(mejores));
    } catch {
        // si el navegador bloquea el almacenamiento, la tabla se muestra igual
    }
    return mejores;
}

function formatearFecha(fechaISO) {
    return new Date(fechaISO).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

// crea una fila de la tabla; se usa textContent para que el nombre no se interprete como HTML
function crearFila(celdas, esActual) {
    const fila = document.createElement("tr");
    if (esActual) fila.classList.add("actual");
    for (const valor of celdas) {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.appendChild(celda);
    }
    return fila;
}

function mostrarResultados(partida, mejores) {
    const datos = (p) => [p.nombre, p.score, p.nivel, formatearFecha(p.fecha)];

    document.getElementById("tablaPartidaActual")
        .replaceChildren(crearFila(datos(partida), false));

    const filasMejores = mejores.map((p, i) => crearFila([i + 1, ...datos(p)], p === partida));
    document.getElementById("tablaMejores").replaceChildren(...filasMejores);

    document.getElementById("PantallaResultados").style.display = "flex";
}

function perder() {
    estado = "finJuego";
    const partida = {
        nombre: nombreJugador,
        score: score,
        nivel: nivelMostrado(),
        fecha: new Date().toISOString(),
    };
    mostrarResultados(partida, guardarPuntaje(partida));
}

function jugarDeNuevo() {
    if (estado !== "finJuego") return;
    resetGame();
    paddle.dy = 0;
    document.getElementById("PantallaResultados").style.display = "none";
    estado = "jugando";
}

// también se puede volver a jugar con Enter
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && estado === "finJuego") {
        jugarDeNuevo();
    }
});

// Dibujo de los elementos en el Canvas
function draw() {
    // Limpiar el fotograma anterior
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar pared derecha (visual)
    ctx.fillStyle = "#555";
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);

    // Dibujar paleta
    ctx.fillStyle = "#600f90";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Dibujar pelota
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#600f90";
    ctx.fill();
    ctx.closePath();

    // Dibujar marcador
    ctx.font = "30px Arial";
    ctx.fillText("Puntos: " + score, canvas.width / 2 - 60, 40);

    // Dibujar nivel actual (esquina superior derecha, junto a la pared)
    ctx.textAlign = "right";
    ctx.fillText("Nivel: " + nivelMostrado(), canvas.width - 30, 40);
    ctx.textAlign = "start";

    // mensaje de bienvenida antes de comenzar
    if (estado === "bienvenida") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "40px Arial";
        ctx.fillText("¡Bienvenido, " + nombreJugador + "!", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText("El juego comenzará en un momento...", canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = "start"; // regresar a la alineación normal
    }
}

// Bucle de animación principal
function gameLoop() {
    // la pelota y la paleta solo se mueven cuando el juego ya comenzó
    if (estado === "jugando") {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();