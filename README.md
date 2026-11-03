# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye los power-ups **Velocidad**, que aumenta temporalmente la propulsión, y **Escudo**, que protege de una colisión con asteroide.

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

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

| Power-up | Aparece | Efecto |
| -------- | ------- | ------ |
| Velocidad | Al destruir asteroides grandes o medianos (20 % de probabilidad, reparto 50/50 con Escudo) | Duplica la propulsión y la velocidad punta de la nave durante 5 segundos |
| Escudo | Al destruir asteroides grandes o medianos (20 % de probabilidad, reparto 50/50 con Velocidad) | Protege de una colisión con asteroide (o estrella fugaz) durante 8 segundos o hasta absorber un impacto |

Los power-ups se dibujan como un rombo cian con un rayo (Velocidad) o un hexágono verde (Escudo), permanecen 12 segundos en pantalla y el HUD muestra una barra que se vacía mientras el efecto está activo. Al absorber un impacto, el escudo destruye el asteroide sin otorgar puntos y desaparece; la nave queda invencible medio segundo para evitar un segundo choque encadenado.

## Estrella fugaz

Cada 14–22 segundos (la primera a los ~12 s de empezar) aparece un aviso ámbar parpadeante en el HUD y en un punto del mapa. Tras 2.5 segundos de aviso entra una **estrella fugaz**: un asteroide grande de color ámbar con cola que se mueve 2.6 veces más rápido que uno normal y desaparece solo a los 8 segundos (se atenúa y parpadea antes de desvanecerse). Solo hay una a la vez.

Si la destruyes puntúa como un asteroide grande (20 puntos) y se parte en dos medianos; si la dejas escapar, se desvanece sin puntos. Limpiar los asteroides normales avanza de nivel aunque quede una estrella viva.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up Velocidad con barra de tiempo restante en el HUD
- Power-up Escudo que absorbe una colisión con asteroide o estrella fugaz, también con barra en el HUD
- Estrella fugaz periódica con aviso previo, velocidad x2.6 y desaparición temporizada
