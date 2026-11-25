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
let inicioBienvenida = 0;

// ---------- efectos visuales (no afectan la física) ----------
const COLORES = {
    fondoArriba: "#1a0b2e",
    fondoAbajo: "#0b0614",
    linea: "rgba(233, 168, 255, 0.18)",
    paleta: "#e9a8ff",
    brilloPaleta: "#a855f7",
    pelota: "#ffffff",
    brilloPelota: "#f472b6",
    pared: "#22d3ee",
    texto: "#f3e8ff",
    textoSuave: "rgba(243, 232, 255, 0.55)",
};
const FUENTE = '"Orbitron", "Segoe UI", sans-serif';
const LARGO_ESTELA = 14;

let estela = [];      // posiciones anteriores de la pelota
let particulas = [];  // chispas al golpear
let destelloPared = 0;   // 0..1, brillo de la pared al rebotar
let destelloPaleta = 0;  // 0..1, brillo de la paleta al golpear
let pulsoPuntos = 0;     // 0..1, animación del marcador

function crearParticulas(x, y, direccion, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const angulo = (Math.random() - 0.5) * Math.PI * 0.9;
        const rapidez = 2 + Math.random() * 4;
        particulas.push({
            x, y,
            vx: Math.cos(angulo) * rapidez * direccion,
            vy: Math.sin(angulo) * rapidez,
            vida: 1,
            tamano: 2 + Math.random() * 2.5,
            color,
        });
    }
}

function actualizarEfectos() {
    for (const p of particulas) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.vida -= 0.03;
    }
    particulas = particulas.filter((p) => p.vida > 0);
    destelloPared = Math.max(0, destelloPared - 0.05);
    destelloPaleta = Math.max(0, destelloPaleta - 0.06);
    pulsoPuntos = Math.max(0, pulsoPuntos - 0.05);
}

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
    inicioBienvenida = performance.now();

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
    destelloPared = 1;
    crearParticulas(canvas.width - 10, ball.y, -1, COLORES.pared, 10);
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
         destelloPaleta = 1;
         pulsoPuntos = 1;
         crearParticulas(paddle.x + paddle.width, ball.y, 1, COLORES.brilloPelota, 14);

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
    estela = [];
    particulas = [];
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
function dibujarFondo() {
    const degradado = ctx.createLinearGradient(0, 0, 0, canvas.height);
    degradado.addColorStop(0, COLORES.fondoArriba);
    degradado.addColorStop(1, COLORES.fondoAbajo);
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // cuadrícula sutil
    ctx.strokeStyle = "rgba(168, 85, 247, 0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // línea central punteada
    ctx.strokeStyle = COLORES.linea;
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // círculo central
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
}

function dibujarPared() {
    ctx.save();
    ctx.shadowColor = COLORES.pared;
    ctx.shadowBlur = 12 + destelloPared * 30;
    ctx.fillStyle = COLORES.pared;
    ctx.globalAlpha = 0.6 + destelloPared * 0.4;
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);
    ctx.restore();
}

function dibujarPaleta() {
    ctx.save();
    ctx.shadowColor = COLORES.brilloPaleta;
    ctx.shadowBlur = 18 + destelloPaleta * 25;
    const degradado = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
    degradado.addColorStop(0, COLORES.brilloPaleta);
    degradado.addColorStop(1, COLORES.paleta);
    ctx.fillStyle = destelloPaleta > 0.5 ? "#ffffff" : degradado;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 7);
    ctx.fill();
    ctx.restore();
}

function dibujarPelota() {
    // estela
    for (let i = 0; i < estela.length; i++) {
        const t = (i + 1) / estela.length;
        ctx.beginPath();
        ctx.arc(estela[i].x, estela[i].y, ball.radius * t, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 114, 182, ${t * 0.35})`;
        ctx.fill();
    }

    ctx.save();
    ctx.shadowColor = COLORES.brilloPelota;
    ctx.shadowBlur = 25;
    const degradado = ctx.createRadialGradient(
        ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.radius
    );
    degradado.addColorStop(0, COLORES.pelota);
    degradado.addColorStop(1, COLORES.brilloPelota);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = degradado;
    ctx.fill();
    ctx.restore();
}

function dibujarParticulas() {
    ctx.save();
    for (const p of particulas) {
        ctx.globalAlpha = p.vida;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tamano * p.vida, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function dibujarMarcador() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = COLORES.textoSuave;
    ctx.font = `500 12px ${FUENTE}`;
    ctx.fillText("PUNTOS", canvas.width / 2, 28);

    const escala = 1 + pulsoPuntos * 0.25;
    ctx.translate(canvas.width / 2, 62);
    ctx.scale(escala, escala);
    ctx.shadowColor = COLORES.brilloPelota;
    ctx.shadowBlur = 10 + pulsoPuntos * 20;
    ctx.fillStyle = COLORES.texto;
    ctx.font = `900 34px ${FUENTE}`;
    ctx.fillText(score, 0, 0);
    ctx.restore();

    // nivel (esquina superior derecha, junto a la pared)
    ctx.save();
    ctx.textAlign = "right";
    ctx.fillStyle = COLORES.textoSuave;
    ctx.font = `500 12px ${FUENTE}`;
    ctx.fillText("NIVEL", canvas.width - 30, 28);
    ctx.fillStyle = COLORES.pared;
    ctx.shadowColor = COLORES.pared;
    ctx.shadowBlur = 10;
    ctx.font = `700 24px ${FUENTE}`;
    ctx.fillText(nivelMostrado(), canvas.width - 30, 56);

    // jugador (esquina superior izquierda)
    if (nombreJugador) {
        ctx.textAlign = "left";
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORES.textoSuave;
        ctx.font = `500 12px ${FUENTE}`;
        ctx.fillText("JUGADOR", 60, 28);
        ctx.fillStyle = COLORES.paleta;
        ctx.font = `700 18px ${FUENTE}`;
        ctx.fillText(nombreJugador, 60, 54);
    }
    ctx.restore();
}

function dibujarBienvenida() {
    ctx.save();
    ctx.fillStyle = "rgba(5, 2, 12, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.shadowColor = COLORES.brilloPaleta;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORES.texto;
    ctx.font = `900 36px ${FUENTE}`;
    ctx.fillText("¡Bienvenido, " + nombreJugador + "!", canvas.width / 2, canvas.height / 2 - 40);

    // cuenta regresiva animada
    const restante = Math.max(0, DURACION_BIENVENIDA - (performance.now() - inicioBienvenida));
    const segundos = Math.ceil(restante / 1000);
    const fraccion = (restante % 1000) / 1000;
    ctx.globalAlpha = 0.4 + fraccion * 0.6;
    ctx.shadowColor = COLORES.brilloPelota;
    ctx.fillStyle = COLORES.brilloPelota;
    ctx.font = `900 ${50 + fraccion * 30}px ${FUENTE}`;
    ctx.fillText(segundos > 0 ? segundos : "¡YA!", canvas.width / 2, canvas.height / 2 + 50);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORES.textoSuave;
    ctx.font = `500 14px ${FUENTE}`;
    ctx.fillText("Prepárate...", canvas.width / 2, canvas.height / 2 + 100);
    ctx.restore();
}

function draw() {
    dibujarFondo();
    dibujarPared();
    dibujarMarcador();
    dibujarParticulas();
    dibujarPaleta();
    dibujarPelota();

    // mensaje de bienvenida antes de comenzar
    if (estado === "bienvenida") {
        dibujarBienvenida();
    }
}

// Bucle de animación principal
function gameLoop() {
    // la pelota y la paleta solo se mueven cuando el juego ya comenzó
    if (estado === "jugando") {
        update();
        estela.push({ x: ball.x, y: ball.y });
        if (estela.length > LARGO_ESTELA) estela.shift();
    }
    actualizarEfectos();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();