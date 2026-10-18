# cotiza-3d

Calculadora de cotizaciones de impresión 3D en pesos chilenos, sin servidor.

[![CI y Pages](https://github.com/IgnacioZanaHopp/cotiza-3d/actions/workflows/ci.yml/badge.svg)](https://github.com/IgnacioZanaHopp/cotiza-3d/actions/workflows/ci.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

Incluye filamento, electricidad, desgaste, fallos, mano de obra y margen sobre
venta. Interfaz en español, responsive, con temas claro/oscuro, navegación por
teclado, etiquetas con unidades y exportación JSON. También permite imprimir o
guardar PDF mediante el diálogo del navegador. No envía tus datos a un servidor;
solo guarda la preferencia de tema en tu navegador.

## Demo

El ejemplo predeterminado produce el siguiente desglose, verificado por pruebas:

| Concepto | CLP |
| --- | ---: |
| Filamento: 120 g a $22.000/kg | $2.640 |
| Electricidad: 150 W × 6 h × $220/kWh | $198 |
| Desgaste: 6 h a $300/h | $1.800 |
| Reserva por fallos: 10% | $515,33 |
| Mano de obra: 25 min a $6.000/h | $2.500 |
| Costo esperado | $7.653,33 |
| **Precio con 30% de margen** | **$10.934** |

[Ver la exportación JSON generada por el motor real](docs/ejemplo.json).
No se adjunta una captura: el sandbox impidió iniciar Chromium y el navegador
conectado denegó abrir localhost. Los tests Playwright generan capturas reales
cuando se ejecutan en un entorno con navegador autorizado; CI las guarda como
artefactos. No se afirma que se hayan ejecutado aquí.

## Instalación y uso

Requiere Node **22.22.2+ o 24.15+**, en sus ramas LTS, y npm. CI usa Node 24.

```sh
npm ci
npm run dev
# Abrir la dirección local que imprime Vite.
```

1. Nombra el proyecto e ingresa los gramos y horas que entrega tu laminador.
2. Ajusta los precios, potencia promedio, desgaste y valor de tu trabajo.
3. Define tasa de fallos y margen; el desglose se actualiza al escribir.
4. Usa **Exportar cotización** para descargar entradas, costos y supuestos en
   JSON, o **Imprimir o guardar PDF** para una copia imprimible.

**Restablecer ejemplo** devuelve todos los valores iniciales. Los campos vacíos,
negativos o fuera de rango ocultan el precio y bloquean la exportación. El cero
es válido. Los porcentajes de la interfaz van de 0 a 99, incluidos decimales.

## Fórmulas y supuestos

```text
filamento = gramos / 1000 × precio_por_kg
electricidad = watts / 1000 × horas × tarifa_kWh
desgaste = horas × costo_desgaste_por_hora
impresión_base = filamento + electricidad + desgaste
impresión_esperada = impresión_base / (1 - tasa_de_fallos / 100)
reserva_por_fallos = impresión_esperada - impresión_base
mano_de_obra = minutos / 60 × tarifa_por_hora
costo = impresión_esperada + mano_de_obra
precio = techo(costo / (1 - margen / 100))
ganancia = precio - costo
```

Se cotiza **una pieza exitosa**. Se supone que cada intento fallido consume una
impresión completa y que los intentos tienen una probabilidad de éxito constante.
La mano de obra se cobra una vez. Si en tu taller cada fallo requiere mucho
trabajo adicional, incorpora ese tiempo en la preparación. No incluye impuestos,
envío ni descuentos. La ganancia corresponde a la diferencia después de cubrir
los costos ingresados, incluidos trabajo y reserva por fallos.

El margen se mide sobre venta: con costo $1.000 y margen 20%, el precio es
$1.250. Los cálculos conservan decimales; solo el precio final se redondea hacia
arriba al peso. El desglose visual redondea cada partida, por lo que puede
haber una diferencia de un peso al sumar los importes mostrados. El JSON conserva
la precisión de cálculo y documenta estos supuestos.

## Arquitectura

- `src/calculator.ts`: función pura, tipos, validación y cálculo sin DOM.
- `src/export.ts`: documento JSON versionado y reproducible con fecha inyectable.
- `src/main.ts`: lectura del formulario, presentación segura con `textContent`,
  descarga local, impresión y tema. El almacenamiento es opcional.
- `index.html` y `src/style.css`: estructura semántica, estilos adaptables y de
  impresión, enfoque visible y descripciones accesibles de unidades.
- `tests/`: pruebas numéricas y de interacción en DOM simulado.
- `e2e/`: flujos completos, descarga, temas, axe, ancho móvil y capturas.

## Desarrollo y pruebas

```sh
npm run lint
npm test
npm run build
npm run preview
# Todos los controles locales sin navegador:
npm run check
# En un entorno que permita iniciar Chromium:
npx playwright install chromium
npm run build
npm run test:e2e
```

Se ejecutaron **27 pruebas Vitest**, ESLint, comprobación estricta de tipos y
build de producción. Los 6 casos Playwright (3 flujos × escritorio/móvil)
están preparados para CI y pendientes de su primera ejecución autorizada.
Las capturas quedan en `test-results/`, ignorado por Git. Las reglas axe ayudan a
detectar problemas; no sustituyen una revisión manual con tecnologías de apoyo.

## GitHub Pages

El workflow `ci.yml` verifica lint, pruebas, build y Playwright antes de desplegar
`dist/`. Las solicitudes de cambio ejecutan validaciones sin desplegar.
Selecciona **Settings → Pages → Source → GitHub Actions** al publicar el repo.
La base relativa de Vite permite servirlo en `/cotiza-3d/` o en un dominio propio.
El sitio quedará en `https://IgnacioZanaHopp.github.io/cotiza-3d/` después del
primer despliegue exitoso; no se ha publicado desde este entorno.

El flujo sigue la [guía oficial de despliegue de Vite](https://vite.dev/guide/static-deploy.html).
Los badges mostrarán resultados reales cuando existan ejecuciones en GitHub.

## Roadmap

- Guardar y recuperar cotizaciones localmente.
- Comparar materiales y escenarios de impresión.
- Cotizaciones por lote con costos fijos de preparación.

## Cómo se construyó

Se desarrolló con asistencia de IA (Codex). El autor es responsable del diseño,
la revisión y las pruebas; los controles automatizados se ejecutaron durante el
desarrollo. La verificación visual y Playwright requieren un entorno autorizado.

## English summary

Static 3D printing quote calculator with transparent costs in Chilean pesos.  
Pure TypeScript pricing logic, JSON export, print styles and light/dark themes.  
Vitest tests plus Playwright checks and a GitHub Pages deployment workflow.

## Licencia

[MIT](LICENSE) © 2026 Ignacio Zañartu Hoppner.
