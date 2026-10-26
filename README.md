# TwistLab

A Rubik's cube timer with an academy: [twistlab.app](https://twistlab.app). Free, ad-free and open source.

*[Versión en español más abajo](#twistlab-español).*

## What it does

- **Solve:** a timer with WCA scrambles for all 15 events, 15 s inspection, penalties, averages (mo3, ao5 up to ao1000),
  sessions, phases, typed-in times, PLL, OLL and F2L training, and a sheet for each time with its shortest cross.
  Imports from csTimer and Twisty Timer.
- **Smart cubes** (GAN, MoYu, QiYi, GiiKER, GoCube…) over Web Bluetooth: the timer starts and stops by itself, and each
  solve is split into cross, F2L, OLL and PLL, with a lesson.
- **Academy:** from the beginner's method to full CFOP, Roux and 2x2, with lessons, trainers and spaced repetition.
- **Challenges:** the daily and the weekly one (the same scramble for everyone, one attempt, a ranking verified with a
  smart cube) and duels by link.
- Spanish, English and Portuguese; works offline (PWA); an optional account syncs between devices.

## How it's built

Vite + TypeScript with no framework (the DOM by hand, `src/el.ts`), [cubing.js](https://github.com/cubing/cubing.js) for
the cube, the scrambles and the solver, Vercel functions in `api/` (JavaScript with JSDoc) and Postgres (Neon). Every file
starts with a comment that says what it does and why.

## On your computer

You need Node 24 or newer (the tests run TypeScript directly).

```sh
npm install
npm run dev      # the app and its API at http://localhost:5173 (the API needs .env.local)
npm test         # the tests (node --test)
npm run build    # tsc + Vite's build + the pages for search engines
```

For the API (account, challenges, reminders), copy `.env.example` to `.env.local`, fill it in and run `npm run db:migrate`
before `npm run dev`: Vite serves `api/` with the same handlers as Vercel. Without `RESEND_API_KEY`, the sign-in code is
printed in the console.

## Your own instance

1. Fork it and create a [Vercel](https://vercel.com) project from your fork (`vercel.json` already has the build and the
   cron).
2. Create a Postgres database (for example [Neon](https://neon.tech)) and set the variables from `.env.example` in the
   project.
3. Deploy. The build runs `npm run db:migrate`, which creates the tables (`db/schema.sql`) and **generates your instance's
   challenge scrambles** a year ahead (`db/scrambles.js`). They are not in the code: if they were, anyone would know
   tomorrow's. Every deploy adds the missing ones.

Please use your own name and logo for your instance: the license covers the code, not the "TwistLab" brand.

## Support

TwistLab is free and ad-free. If it helps you, you can help pay for the server and the database:
[sponsor it on GitHub](https://github.com/sponsors/sancospi).

## Contributing

Ideas and fixes are welcome: [issues](https://github.com/sancospi/twistlab/issues) and pull requests. Security issues go
in private: see [SECURITY.md](SECURITY.md). Before sending a pull request, `npm test` and `npm run build` must pass, and
new texts go in all three languages (`src/i18n/es.ts`, `en.ts`, `pt.ts`; a test requires the same keys). Follow the
style of the surrounding code, comments included.

## License

Copyright © 2026 the TwistLab authors. [GNU AGPL-3.0](LICENSE) or later. You can use, study, change and share TwistLab; if
you publish a modified version as a web service, you must offer its source code under the same license.

Thanks to [cubing.js](https://github.com/cubing/cubing.js) (MPL-2.0 or GPL-3.0),
[gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth) (MIT),
[Chivo Mono](https://github.com/Omnibus-Type/ChivoMono) (OFL-1.1), the timers' typeface, and
[SpeedCubeDB](https://speedcubedb.com), where the Academy's algorithms come from.

---

# TwistLab (español)

Cronómetro de cubo de Rubik con academia: [twistlab.app](https://twistlab.app). Gratis, sin anuncios y de código abierto.

## Qué hace

- **Resolver:** cronómetro con mezclas WCA de las 15 categorías, inspección de 15 s, penalizaciones, medias (mo3, ao5 hasta
  ao1000), sesiones, fases, tiempos escritos a mano, entrenamiento de PLL, OLL y F2L, y la ficha de cada tiempo con la
  cruz más corta. Importa de csTimer y Twisty Timer.
- **Cubos inteligentes** (GAN, MoYu, QiYi, GiiKER, GoCube…) por Web Bluetooth: arranca y para solo, y parte cada
  resolución en cruz, F2L, OLL y PLL con una lección.
- **Academia:** del método principiante al CFOP completo, Roux y 2x2, con lecciones, entrenadores y repaso espaciado.
- **Retos:** el del día y el semanal (la misma mezcla para todos, un intento, ranking verificado con cubo inteligente) y
  duelos por enlace.
- Español, inglés y portugués; funciona sin conexión (PWA); cuenta opcional para sincronizar entre aparatos.

## Cómo está hecho

Vite + TypeScript sin framework (el DOM a mano, `src/el.ts`), [cubing.js](https://github.com/cubing/cubing.js) para el
cubo, las mezclas y el solver, funciones de Vercel en `api/` (JavaScript con JSDoc) y Postgres (Neon). Cada archivo
empieza con un comentario que explica qué hace y por qué.

## En tu ordenador

Necesitas Node 24 o más reciente (los tests ejecutan TypeScript directamente).

```sh
npm install
npm run dev      # la app y su API en http://localhost:5173 (la API necesita .env.local)
npm test         # los tests (node --test)
npm run build    # tsc + build de Vite + las páginas para buscadores
```

Para la API (cuenta, retos, recordatorios), copia `.env.example` a `.env.local`, rellénalo y ejecuta `npm run db:migrate`
antes de `npm run dev`: Vite sirve `api/` con los mismos handlers que Vercel. Sin `RESEND_API_KEY`, el código para
entrar sale en la consola.

## Tu propia instancia

1. Haz un fork y crea un proyecto en [Vercel](https://vercel.com) con él (`vercel.json` ya trae el build y el cron).
2. Crea una base de datos Postgres (por ejemplo [Neon](https://neon.tech)) y pon las variables de `.env.example` en el
   proyecto.
3. Despliega. El build ejecuta `npm run db:migrate`, que crea las tablas (`db/schema.sql`) y **genera las mezclas de los
   retos** de tu instancia, un año por delante (`db/scrambles.js`). No están en el código: si lo estuvieran, cualquiera
   sabría las de mañana. Cada deploy añade las que falten.

Usa otro nombre y otro logo para tu instancia: la licencia cubre el código, no la marca «TwistLab».

## Apoyar

TwistLab es gratis y sin anuncios. Si te sirve, puedes ayudar a pagar el servidor y la base de datos:
[patrocinar en GitHub](https://github.com/sponsors/sancospi).

## Contribuir

Las propuestas y los arreglos son bienvenidos: [issues](https://github.com/sancospi/twistlab/issues) y pull requests.
Los fallos de seguridad, en privado: ver [SECURITY.md](SECURITY.md). Antes de enviar uno: `npm test` y `npm run build`
sin errores, y los textos nuevos en los tres idiomas (`src/i18n/es.ts`, `en.ts`, `pt.ts`; un test exige las mismas
claves). Sigue el estilo del código de alrededor, incluidos sus comentarios.

## Licencia

Copyright © 2026 los autores de TwistLab. [GNU AGPL-3.0](LICENSE) o posterior. Puedes usar, estudiar, cambiar y compartir
TwistLab; si publicas una versión modificada como servicio web, tienes que ofrecer su código fuente con la misma licencia.

Gracias a [cubing.js](https://github.com/cubing/cubing.js) (MPL-2.0 o GPL-3.0),
[gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth) (MIT),
[Chivo Mono](https://github.com/Omnibus-Type/ChivoMono) (OFL-1.1), la fuente de los cronómetros, y
[SpeedCubeDB](https://speedcubedb.com), de donde vienen los algoritmos de la Academia.
