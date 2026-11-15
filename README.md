# Pin-Pong VS Pared

Juego de entrenamiento estilo pong para un solo jugador, hecho con HTML, CSS y JavaScript (Canvas). El jugador controla una paleta del lado izquierdo y debe devolver la pelota, que rebota contra una pared en el lado derecho. Cada golpe suma puntos, y conforme sube el puntaje el juego sube de nivel y se vuelve más rápido.

## Cómo jugar

1. Abre `index.html` en el navegador (no necesita servidor ni instalación).
2. Escribe tu nombre y presiona **Entrar** (o la tecla Enter).
3. Después de un mensaje de bienvenida de 2 segundos empieza el juego.
4. Mueve la paleta con:
   - **R** / **Flecha arriba**: subir
   - **F** / **Flecha abajo**: bajar
5. Si la pelota pasa detrás de tu paleta, pierdes y se muestra la tabla de resultados.
6. Presiona **Jugar de nuevo** (o Enter) para volver a empezar.

## Puntuación

- Cada vez que la pelota golpea la paleta se suman **10 puntos**.
- En cada golpe la pelota también acelera un poco (+0.2 en el eje horizontal).

## Niveles

Los niveles son **infinitos**: se sube un nivel cada **50 puntos**.

| Puntos   | Nivel |
|----------|-------|
| 0 – 49   | 1     |
| 50 – 99  | 2     |
| 100 – 149| 3     |
| ...      | ...   |

El nivel actual se muestra en la esquina superior derecha del juego.

Al subir de nivel:

- La pelota aumenta su velocidad en **+1** en ambos ejes (sin cambiar de dirección).
- La paleta aumenta su velocidad en **+0.5**, para que el jugador pueda seguir el ritmo.

### Velocidad máxima

La pelota tiene una velocidad máxima de **15** por eje. Empieza en 6, por lo que llega al tope alrededor del nivel 9–10. A partir de ahí los niveles siguen subiendo, pero la pelota ya no acelera.

El límite evita que la pelota atraviese la paleta sin rebotar: la zona de choque mide 35 px (15 px de paleta + 20 px de diámetro de la pelota), así que mientras la pelota avance menos de eso por fotograma, la colisión siempre se detecta.

Los valores se pueden ajustar en las constantes al inicio de la sección de niveles de `game.js`:

| Constante                 | Valor | Qué controla                                  |
|---------------------------|-------|-----------------------------------------------|
| `PUNTOS_POR_NIVEL`        | 50    | Puntos necesarios para subir un nivel         |
| `INCREMENTO_PELOTA`       | 1     | Velocidad que gana la pelota por nivel        |
| `INCREMENTO_PALETA`       | 0.5   | Velocidad que gana la paleta por nivel        |
| `INCREMENTO_POR_GOLPE`    | 0.2   | Velocidad que gana la pelota en cada golpe    |
| `VELOCIDAD_MAXIMA_PELOTA` | 15    | Velocidad máxima de la pelota por eje         |

## Tabla de resultados

Al perder aparece una pantalla con dos tablas:

1. **Tu partida**: jugador, score, nivel alcanzado y fecha.
2. **Top 3 mejores scores**: las tres mejores partidas guardadas, con los mismos datos. Si la partida actual entró al top 3, su fila aparece resaltada.

Los mejores scores se guardan en el **`localStorage`** del navegador, con la clave `pongVsPared_mejoresPuntajes`. Esto significa que:

- Se conservan aunque se cierre la página o se reinicie la computadora.
- Cada navegador/computadora tiene su propio top 3 (no se comparte entre jugadores de distintas máquinas).
- Se borran si se limpian los datos del navegador.

## Estados del juego

El juego pasa por estos estados (variable `estado`):

`inicio` → `bienvenida` → `jugando` → `finJuego` → `jugando` → ...

- **inicio**: se pide el nombre del jugador.
- **bienvenida**: mensaje de bienvenida durante 2 segundos.
- **jugando**: la pelota y la paleta se mueven.
- **finJuego**: se muestra la tabla de resultados.

## Funciones de `game.js`

### Juego

| Función      | Descripción |
|--------------|-------------|
| `entrar()`   | Valida el nombre, oculta la pantalla de inicio y muestra la bienvenida antes de empezar. |
| `update()`   | Mueve la paleta y la pelota, maneja los rebotes con las paredes, detecta el golpe con la paleta (suma puntos y revisa el nivel) y detecta cuando el jugador pierde. |
| `draw()`     | Dibuja en el canvas la pared, la paleta, la pelota, el puntaje, el nivel y el mensaje de bienvenida. |
| `gameLoop()` | Bucle principal: llama a `update()` (solo mientras se juega) y a `draw()` en cada fotograma. |
| `resetGame()`| Regresa la pelota al centro y reinicia velocidades, puntaje y nivel. |

### Niveles

| Función                                | Descripción |
|----------------------------------------|-------------|
| `levels()`                             | Calcula el nivel según el puntaje y, si se cruzó un nuevo múltiplo de 50, sube de nivel y aumenta la velocidad. |
| `aumentarVelocidad()`                  | Aumenta la velocidad de la pelota y de la paleta al subir de nivel. |
| `acelerar(velocidad, incremento)`      | Suma rapidez a una velocidad sin cambiar su dirección y sin pasar de la velocidad máxima. |
| `nivelMostrado()`                      | Devuelve el nivel que ve el jugador (empieza en 1). |

### Resultados

| Función                                | Descripción |
|----------------------------------------|-------------|
| `perder()`                             | Termina la partida, guarda el resultado y muestra la tabla de resultados. |
| `cargarMejores()`                      | Lee los mejores scores guardados en `localStorage`. |
| `guardarPuntaje(partida)`              | Agrega la partida, ordena de mayor a menor score y guarda solo los 3 mejores. |
| `mostrarResultados(partida, mejores)`  | Llena las tablas de la pantalla de resultados y la muestra. |
| `crearFila(celdas, esActual)`          | Crea una fila de tabla (usa `textContent` para que el nombre no se interprete como HTML). |
| `formatearFecha(fechaISO)`             | Convierte la fecha guardada a formato local (es-MX). |
| `jugarDeNuevo()`                       | Oculta los resultados, reinicia el juego y vuelve a empezar. |

## Archivos

- `index.html`: estructura de la página, estilos, pantalla de inicio y pantalla de resultados.
- `game.js`: toda la lógica del juego.
