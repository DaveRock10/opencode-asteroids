# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye los power-ups **Velocidad** y **Triple Disparo**, que aparecen al destruir asteroides grandes o medianos.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `S`       | Cambiar skin de la nave |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

| Power-up | Aparece | Efecto |
| -------- | ------- | ------ |
| Velocidad | Al destruir asteroides grandes o medianos (20 % de probabilidad) | Duplica la propulsión y la velocidad punta de la nave durante 5 segundos |
| Triple Disparo | Al destruir asteroides grandes o medianos (20 % de probabilidad independiente de Velocidad) | Dispara 3 balas en abanico (±12°) durante 5 segundos |

El power-up de Velocidad se dibuja como un rombo cian con un rayo y el de Triple Disparo como un rombo magenta con tres trazos en abanico. Ambos permanecen 12 segundos en pantalla, pueden estar activos a la vez y el HUD muestra una barra que se vacía mientras cada efecto está activo.

## Skins

La apariencia de la nave es solo cosmética: no modifica el hitbox, la física ni el disparo. Pulsa `S` en cualquier momento (también durante la muerte o en Game Over) para ciclar entre estas 6 skins:

| Skin      | Estilo                                   |
| --------- | ---------------------------------------- |
| Clásica   | Silueta blanca original                  |
| Neón      | Trazo cian con brillo                    |
| Caza      | Silueta ancha con cabina y alas          |
| Fantasma  | Trazo violeta translúcido                |
| Halcón    | Alas barridas en ámbar                   |
| Tridente  | Morro triple en magenta                  |

La skin activa se indica abajo a la izquierda del HUD, se resalta al cambiarla y se guarda en `localStorage`, por lo que se conserva al recargar la página. Los iconos de vidas usan la misma silueta y color.

## Estrella fugaz

Cada 14–22 segundos (la primera a los ~12 s de empezar) aparece un aviso ámbar parpadeante en el HUD y en un punto del mapa. Tras 2.5 segundos de aviso entra una **estrella fugaz**: un asteroide grande de color ámbar con cola que se mueve 2.6 veces más rápido que uno normal y desaparece solo a los 8 segundos (se atenúa y parpadea antes de desvanecerse). Solo hay una a la vez.

Si la destruyes puntúa como un asteroide grande (20 puntos) y se parte en dos medianos; si la dejas escapar, se desvanece sin puntos. Limpiar los asteroides normales avanza de nivel aunque quede una estrella viva.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up Velocidad con barra de tiempo restante en el HUD
- Power-up Triple Disparo (3 balas en abanico) con su propia barra en el HUD
- Estrella fugaz periódica con aviso previo, velocidad x2.6 y desaparición temporizada
- 6 skins de nave seleccionables con `S` y persistentes entre sesiones
