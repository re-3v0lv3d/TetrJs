// main.js

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

const piezas = [
  { forma: [[0, 0], [1, 0], [1, 1], [0, 1]], color: 'yellow' },
  { forma: [[0, 0], [1, 0], [2, 0], [3, 0]], color: 'cyan' },
  { forma: [[0, 0], [1, 0], [2, 0], [2, 1]], color: 'orange' },
  { forma: [[0, 1], [1, 1], [2, 1], [2, 0]], color: 'blue' },
  { forma: [[1, 0], [2, 0], [0, 1], [1, 1]], color: 'red' },
  { forma: [[0, 0], [1, 0], [1, 1], [2, 1]], color: 'green' },
  { forma: [[1, 0], [0, 1], [1, 1], [2, 1]], color: 'purple' }
];

// Música pa' que el vecino te odie, colega
const musica = new Audio('tetrjs.mp3');
musica.loop = true;
musica.volume = 0.4;

const linea = new Audio('line.wav');
linea.loop = false;
linea.volume = 1.0;

let piezaActual = crearPiezaAleatoria();
let tablero = crearTablero();
let lineas = 0;
let nivel = 0;
let puntaje = 0;
let juegoActivo = false;
let intervalo;

function crearPiezaAleatoria() {
  const indicePieza = Math.floor(Math.random() * piezas.length);
  const pieza = piezas[indicePieza];
  return { forma: pieza.forma, color: pieza.color, x: 3, y: 0 };
}

function crearTablero() {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

// Pinta la pieza, obvio, genio
function dibujarPieza(pieza) {
  ctx.fillStyle = pieza.color;
  pieza.forma.forEach(punto => ctx.fillRect(pieza.x + punto[0], pieza.y + punto[1], 1, 1));
}

function dibujarTablero() {
  tablero.forEach((fila, y) => fila.forEach((valor, x) => {
    if (valor !== 0) {
      ctx.fillStyle = valor;
      ctx.fillRect(x, y, 1, 1);
    }
  }));
}

function moverPiezaAbajo() {
  if (!juegoActivo) return;
  if (colisionAbajo()) {
    fijarPieza();
    if (verificarGameOver()) return finJuego();
    eliminarLineasCompletas();
    piezaActual = crearPiezaAleatoria();
  } else {
    piezaActual.y++;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarTablero();
  dibujarPieza(piezaActual);
  actualizarHUD();
}

function moverIzquierda() {
  if (!juegoActivo) return;
  piezaActual.x--;
  if (colisionHorizontal()) piezaActual.x++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarTablero();
  dibujarPieza(piezaActual);
}

function moverDerecha() {
  if (!juegoActivo) return;
  piezaActual.x++;
  if (colisionHorizontal()) piezaActual.x--;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarTablero();
  dibujarPieza(piezaActual);
}

// Gira, colega, como tu vida en una rave
function rotarPieza() {
  if (!juegoActivo) return;
  const formaOriginal = [...piezaActual.forma];
  const formaRotada = formaOriginal.map(([x, y]) => [-y, x]);
  if (esRotacionValida(formaRotada)) piezaActual.forma = formaRotada;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarTablero();
  dibujarPieza(piezaActual);
}

function colisionAbajo() {
  const forma = piezaActual.forma;
  const x = piezaActual.x;
  const y = piezaActual.y;
  for (let i = 0; i < forma.length; i++) {
    const px = x + forma[i][0];
    const py = y + forma[i][1] + 1;
    if (py >= ROWS || (tablero[py] && tablero[py][px] !== 0)) return true;
  }
  return false;
}

function colisionHorizontal() {
  const forma = piezaActual.forma;
  const x = piezaActual.x;
  const y = piezaActual.y;
  for (let i = 0; i < forma.length; i++) {
    const px = x + forma[i][0];
    const py = y + forma[i][1];
    if (px < 0 || px >= COLS || (tablero[py] && tablero[py][px] !== 0)) return true;
  }
  return false;
}

function fijarPieza() {
  piezaActual.forma.forEach(punto => {
    tablero[piezaActual.y + punto[1]][piezaActual.x + punto[0]] = piezaActual.color;
  });
}

function esRotacionValida(formaRotada) {
  const x = piezaActual.x;
  const y = piezaActual.y;
  for (let i = 0; i < formaRotada.length; i++) {
    const px = x + formaRotada[i][0];
    const py = y + formaRotada[i][1];
    if (px < 0 || px >= COLS || py < 0 || py >= ROWS || (tablero[py] && tablero[py][px] !== 0)) return false;
  }
  return true;
}

function eliminarLineasCompletas() {
  let lineasEliminadas = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (tablero[y].every(valor => valor !== 0)) {
      tablero.splice(y, 1);
      tablero.unshift(Array(COLS).fill(0));
      lineas++;
      lineasEliminadas++;
      y++;
      linea.play(); // ¡PUM! Línea fuera, crack
    }
  }
  if (lineasEliminadas > 0) {
    puntaje += lineasEliminadas * 100;
    actualizarNivel();
  }
}

// Nivel sube, obvio, a sudar
function actualizarNivel() {
  const nuevoNivel = Math.floor(lineas / 3) + 1;
  if (nuevoNivel !== nivel) {
    nivel = nuevoNivel;
    clearInterval(intervalo);
    const velocidad = Math.max(100, 750 - (nivel - 1) * 75);
    intervalo = setInterval(moverPiezaAbajo, velocidad);
  }
}

function verificarGameOver() {
  return tablero[0].some(valor => valor !== 0);
}

function finJuego() {
  juegoActivo = false;
  clearInterval(intervalo);
  musica.pause();
  musica.currentTime = 0;
  alert(`¡Game Over! Puntos: ${puntaje}, Líneas: ${lineas}, Nivel: ${nivel}`);
}

function actualizarHUD() {
  document.getElementById('score').innerText = puntaje;
  document.getElementById('lines').innerText = lineas;
  document.getElementById('level').innerText = nivel;
}

// ¡A jugar, vago!
function play() {
  if (juegoActivo) return;
  juegoActivo = true;
  tablero = crearTablero();
  piezaActual = crearPiezaAleatoria();
  lineas = 0;
  nivel = 1;
  puntaje = 0;
  const velocidadInicial = 750;
  intervalo = setInterval(moverPiezaAbajo, velocidadInicial);
  musica.play(); // ¡Fiesta ON, colega!
  actualizarHUD();
}

document.addEventListener('keydown', manejarTecla);

function manejarTecla(evento) {
  switch (evento.keyCode) {
    case 37: moverIzquierda(); break;
    case 39: moverDerecha(); break;
    case 38: rotarPieza(); break;
    case 40: moverPiezaAbajo(); break;
  }
}