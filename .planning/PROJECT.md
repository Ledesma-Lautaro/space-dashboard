# Space Dashboard — Asteroides + Clima Espacial

## What This Is

Un dashboard web de una sola pantalla con estética retro/terminal CRT que consume datos reales de la NASA: un clasificador de asteroides potencialmente peligrosos (NeoWs), un panel de clima espacial (DONKI), y una visualización 3D estilizada del sistema solar hecha en Three.js que actúa como columna vertebral del proyecto — no como decoración. Es un proyecto personal de Lautaro para acercarse al sector espacial como hobby/estudio complementario, con la intención de que termine siendo pieza de portfolio.

## Core Value

Aprender Three.js en profundidad construyendo una escena 3D data-driven que realmente entiendo línea por línea — si eso significa que la v1 tarde más, está bien.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Escena 3D del sistema solar estilizado (órbitas como líneas, sin texturas ni escalas realistas) construida con Three.js vanilla
- [ ] Asteroides de NeoWs representados dentro de la escena 3D con tamaño y distancia relativos
- [ ] Eventos de DONKI (CME) representados visualmente saliendo del Sol en la escena 3D
- [ ] Raycasting: click sobre un objeto 3D abre un overlay HUD tipo terminal con su detalle, sin salir de la escena
- [ ] Lista/clasificador de asteroides cercanos con modelo de riesgo (distancia, velocidad, tamaño estimado, flag "potencialmente peligroso")
- [ ] Detalle por asteroide: distancia de acercamiento, velocidad relativa, tamaño estimado, historial de acercamientos previos
- [ ] Panel de alertas de clima espacial (CME, llamaradas solares, tormentas geomagnéticas) en formato terminal
- [ ] Línea de tiempo / gráfico de actividad solar reciente (no solo lista de texto)
- [ ] Filtro CRT completo: scanlines + viñeta + aberración cromática, con postprocessing real (EffectComposer + shaders propios) sobre el canvas 3D
- [ ] Paleta verde fósforo + magenta/violeta sobre negro profundo, tipografía monoespaciada pixelada
- [ ] Layout responsive en mobile y desktop por igual, todo en una pantalla con scroll
- [ ] Estados de carga, error y rate-limit visibles con estética terminal — el dashboard nunca queda en blanco si NASA falla
- [ ] Deploy funcionando en Vercel
- [ ] README / caso de estudio con capturas, decisiones técnicas y aprendizajes

### Out of Scope

- Backend propio o API routes de Next.js — la key de NASA se expone en el cliente a propósito; es aceptable para esta versión y mantiene el MVP 100% client-side
- Persistencia de datos — no hay nada que guardar entre sesiones en v1
- Cuentas de usuario o login — el dashboard es público y de solo lectura
- Polling automático / tiempo real — los datos se piden al cargar o recargar la página, bajo demanda
- Texturas fotorrealistas y escalas orbitales fieles — la estética elegida es esquemática y estilizada, no simulación científica
- Clima de Marte (InSight Weather API) — la misión terminó en 2022 y el endpoint puede no devolver datos vigentes; DONKI cubre el rol de "clima" del proyecto
- React Three Fiber en v1 — abstrae justamente la API que el proyecto existe para aprender; se evalúa migrar después
- Rutas separadas / multipágina — el dashboard es una sola pantalla con scroll

## Context

- **Estado del código:** greenfield. Repo nuevo en `C:\Users\Lau\Documents\VsCode\space-dashboard`, sin código previo.
- **Motivación:** acercamiento al sector espacial como hobby y estudio complementario. La prioridad declarada es el aprendizaje por sobre la velocidad de entrega.
- **Audiencia:** laboratorio de aprendizaje primero, portfolio después. Tiene que quedar pulido al final, pero no a costa de saltear el entendimiento técnico.
- **Referencia visual:** paneles de alerta estilo terminal (`>> CME DETECTED - INTENSITY: MODERATE`), sistema solar dibujado a mano con órbitas como círculos.
- **Riesgo conocido — rate limits:** la API de NASA con `DEMO_KEY` permite ~30 req/hora por IP; una key personal, ~1000/hora. Con la key en el cliente y varias secciones pidiendo datos al cargar, esto se puede agotar rápido. Por eso los estados de error/rate-limit están dentro del scope de v1.
- **Riesgo conocido — performance:** postprocessing con shaders sobre WebGL en mobile es caro. La escena tiene que degradar bien (menos passes, resolución reducida, o `prefers-reduced-motion`).

## Constraints

- **Tech stack**: Next.js + Three.js vanilla (no R3F) — Three.js puro es requisito de aprendizaje, no preferencia estética
- **Arquitectura**: 100% client-side, sin backend propio ni API routes — decisión explícita para mantener el MVP simple
- **Hosting**: Vercel — deploy simple y gratuito para un proyecto estático/client-side
- **Datos**: solo NASA NeoWs (`/neo/rest/v1/feed` + detalle) y DONKI (`/DONKI/CME`, `/DONKI/FLR`, notificaciones) — sin otras fuentes en v1
- **Actualización**: bajo demanda (fetch al cargar/recargar) — sin polling ni websockets
- **Responsive**: mobile y desktop tratados como iguales desde el arranque — ni mobile-first ni desktop-first
- **Prioridad**: profundidad de aprendizaje en Three.js > velocidad de entrega

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three.js vanilla en vez de React Three Fiber | R3F abstrae el renderer, la scene y el render loop — justo la API que el proyecto existe para aprender. Se evalúa migrar una vez que la escena esté clara | — Pending |
| La escena 3D es el centro, no decoración | Asteroides de NeoWs y CMEs de DONKI se representan en 3D y son clickeables. Maximiza el aprendizaje (raycasting, geometría data-driven, interacción) y evita que el 3D quede como fondo desconectado | — Pending |
| Postprocessing real con shaders propios para el CRT | Overlay CSS habría sido más barato, pero la aberración cromática por canal RGB en EffectComposer es aprendizaje directo de shaders. Costo aceptado: es una fase entera y pesa en mobile | — Pending |
| Click abre overlay HUD sobre el canvas, no scroll al panel 2D | Mantiene al usuario dentro de la escena y refuerza que el 3D es la vista principal | — Pending |
| Key de NASA expuesta en el cliente, sin proxy | Sin backend el MVP es más simple y el deploy trivial. La key es gratuita y revocable; el costo de exponerla es bajo frente a la complejidad de un proxy | — Pending |
| InSight Weather (clima de Marte) descartada | Misión terminada en 2022, endpoint sin datos vigentes. DONKI cubre el rol de "clima" del proyecto con datos activos | ✓ Good |
| Resiliencia ante fallas de API dentro de v1 | Con la key en el cliente y rate limits ajustados, un dashboard de portfolio que muestra pantalla en blanco al fallar NASA se lee como roto | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-26 after initialization*
