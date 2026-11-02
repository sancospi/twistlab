// English for cfop.ts, keyed by the Spanish text. Multi-line texts are translated one line at a time.
export const EN: Record<string, string> = {
  'Plan B: más fácil al principio, con solo `R`, `U` y `F` o gatillos que ya conoces.': 'Plan B: easier at first, with only `R`, `U` and `F` or triggers you already know.',
  "Empieza con `y'`, un giro del cubo entero: así metes el par con la mano derecha. El Plan B hace lo mismo con `F`, sin girar el cubo.":
    "The algorithm starts with `y'`, a whole-cube rotation: that way you insert the pair with your right hand. Plan B does the same with `F`, without rotating the cube.",
  'Usa `r`, un giro de dos capas: `R` y la capa del medio a la vez.': 'This case uses `r`, a wide move: `R` and the middle layer together.',

  // F2L recognition
  'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el verde arriba': 'Corner at top front-right, white facing front; edge at top right, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el naranja arriba': 'Corner at top front-right, white facing right; edge at top front, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el verde arriba': 'Corner at top front-right, white facing right; edge at top back, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el naranja arriba': 'Corner at top front-right, white facing front; edge at top left, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba atrás, con el verde arriba': 'Corner at top front-right, white facing front; edge at top back, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la izquierda, con el naranja arriba': 'Corner at top front-right, white facing right; edge at top left, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el verde arriba': 'Corner at top front-right, white facing right; edge at top right, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el naranja arriba': 'Corner at top front-right, white facing front; edge at top front, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el verde arriba': 'Corner at top front-right, white facing front; edge at top left, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el naranja arriba': 'Corner at top front-right, white facing right; edge at top back, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la derecha, con el verde arriba': 'Corner at top front-right, white facing up; edge at top right, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba adelante, con el naranja arriba': 'Corner at top front-right, white facing up; edge at top front, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el verde arriba': 'Corner at top front-right, white facing up; edge at top back, green facing up',
  'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la izquierda, con el naranja arriba': 'Corner at top front-right, white facing up; edge at top left, orange facing up',
  'Esquina en la ranura, con el blanco al frente; arista arriba a la derecha, con el verde arriba': 'Corner in the slot, white facing front; edge at top right, green facing up',
  'Esquina en la ranura, con el blanco abajo; arista arriba adelante, con el naranja arriba': 'Corner in the slot, white facing down; edge at top front, orange facing up',
  'Esquina arriba, adelante a la derecha, con el blanco arriba; arista en su sitio, en la ranura': 'Corner at top front-right, white facing up; edge in its place, in the slot',
  'Esquina en la ranura, con el blanco al frente; arista en su sitio, en la ranura': 'Corner in the slot, white facing front; edge in its place, in the slot',
  'Esquina en la ranura, con el blanco a la derecha; arista en su sitio, en la ranura': 'Corner in the slot, white facing right; edge in its place, in the slot',

  // OLL / PLL cases
  'Línea': 'Line',
  'Punto': 'Dot',
  'U (faros)': 'U (headlights)',
  'L (esquinas)': 'L (corners)',
  'Línea amarilla de izquierda a derecha': 'Yellow line from left to right',
  'Dos aristas amarillas, adelante y a la derecha': 'Two yellow edges, at the front and on the right',
  'Ninguna arista amarilla arriba, solo el centro': 'No yellow edge on top, only the center',
  'En el CFOP completo es el caso OLL 45.': "In full CFOP, it's OLL 45.",
  'Usa `f`, un giro de dos capas. En el CFOP completo es el caso OLL 44.': "This case uses `f`, a wide move. In full CFOP, it's OLL 44.",
  'No es nuevo: es la Línea seguida de la L, sin giro en medio.': "Nothing new: it's the Line followed by the L, with no move in between.",
  'Una esquina con el amarillo arriba, la de adelante a la izquierda; la de adelante a la derecha, con el amarillo al frente': 'One corner with yellow facing up, the front-left one; the front-right one, with yellow facing front',
  'Una esquina con el amarillo arriba, la de atrás a la derecha; la de adelante a la izquierda, con el amarillo al frente': 'One corner with yellow facing up, the back-right one; the front-left one, with yellow facing front',
  'Ninguna esquina con el amarillo arriba; 2 amarillos a la izquierda y 2 a la derecha': 'No corner with yellow facing up; 2 yellows facing left and 2 facing right',
  'Ninguna esquina con el amarillo arriba; 2 amarillos a la izquierda; a la derecha, uno al frente y otro atrás': 'No corner with yellow facing up; 2 yellows facing left; on the right, one facing front and one facing back',
  'Dos esquinas con el amarillo arriba, las de atrás; las de adelante, con el amarillo al frente': 'Two corners with yellow facing up, the back ones; the front ones, with yellow facing front',
  'Dos esquinas con el amarillo arriba, las de la derecha; a la izquierda, un amarillo al frente y otro atrás': 'Two corners with yellow facing up, the right ones; on the left, one yellow facing front and one facing back',
  'Dos esquinas con el amarillo arriba, en diagonal (atrás a la izquierda y adelante a la derecha); la de adelante a la izquierda, con el amarillo al frente': 'Two corners with yellow facing up, on a diagonal (back-left and front-right); the front-left one, with yellow facing front',
  'Sune y Antisune son inversos: la preparación de uno es el algoritmo del otro.': 'Sune and Antisune are inverses: the setup of one is the algorithm of the other.',
  'Los casos U y L de las esquinas son inversos: la preparación de uno es el algoritmo del otro. `D` gira la capa de abajo en sentido horario, mirándola desde abajo.':
    'The U and L corner cases are inverses: the setup of one is the algorithm of the other. `D` turns the bottom layer clockwise, as seen from below.',
  'Ua y Ub son inversos: la preparación de uno es el algoritmo del otro. `M` gira en el mismo sentido que `L`.':
    'Ua and Ub are inverses: the setup of one is the algorithm of the other. `M` turns the same way as `L`.',
  '`M2` gira 2 veces la capa del medio, entre `L` y `R`, así que da igual el sentido.':
    "`M2` turns the middle layer (between `L` and `R`) twice, so the direction doesn't matter.",
  'Un solo lado con faros o completo, a la izquierda': 'Only one side, on the left, has headlights or is solved',
  'Gira `U` hasta dejar los faros, o el lado completo, a la izquierda. Aparece en 2 de cada 3 resoluciones.':
    'Turn `U` until the headlights, or the solved side, are on the left. It shows up in 2 out of 3 solves.',
  'Ningún lado tiene faros ni está completo': 'No side has headlights or is solved',
  'Aparece en 1 de cada 6 resoluciones. Puedes hacerla desde cualquier lado, sin girar `U` antes.':
    'It shows up in 1 out of 6 solves. You can do it from any side, without turning `U` first.',
  'Un lado completo, atrás; la arista del frente tiene el color del centro de la derecha': 'One solved side, at the back; the front edge has the color of the right center',
  'Un lado completo, atrás; la arista del frente tiene el color del centro de la izquierda': 'One solved side, at the back; the front edge has the color of the left center',
  'Ningún lado completo; cada arista tiene el color del lado opuesto': 'No solved side; each edge has the color of the opposite side',
  'Ningún lado completo; la arista del frente tiene el color del centro de la izquierda, y la de la izquierda, el del centro del frente':
    'No solved side; the front edge has the color of the left center, and the left edge has the color of the front center',
  '`M` gira en el mismo sentido que `L`. Haz también la `U` del principio, aunque las esquinas ya estén alineadas: el resto del algoritmo las vuelve a alinear.':
    '`M` turns the same way as `L`. Do the `U` at the start too, even if the corners are already lined up: the rest of the algorithm lines them up again.',

  // Quizzes
  'Haz la mezcla con el amarillo arriba y el verde al frente. Quedan resueltas la cruz y 3 ranuras: reconoce el caso del par verde-naranja y resuélvelo. Puede hacer falta un giro U para verlo como en su figura.':
    'Do the scramble with yellow facing up and green facing front. The cross and 3 slots end up solved: recognize the green-orange pair\'s case and solve it. You may need to turn U first so it matches its diagram.',
  'Haz la mezcla con el amarillo arriba y el verde al frente. Quedan resueltas las dos primeras capas: reconoce el caso, gira la capa de arriba hasta verlo como en su figura y resuélvelo.':
    'Do the scramble with yellow facing up and green facing front. The first two layers end up solved: recognize the case, turn the top layer until it looks like its diagram and solve it.',
  'Haz la mezcla con el amarillo arriba y el verde al frente. La cara amarilla queda completa: reconoce el caso de este paso y resuélvelo.':
    "Do the scramble with yellow facing up and green facing front. The yellow face ends up complete: recognize this step's case and solve it.",
  'Quiz F2L-A (inserciones básicas)': 'Quiz F2L-A (basic inserts)',
  'Quiz F2L-B (sin formar par)': 'Quiz F2L-B (not paired yet)',
  'Quiz F2L-C (arista lejos)': 'Quiz F2L-C (edge far away)',
  'Quiz F2L-D (blanco arriba)': 'Quiz F2L-D (white up)',
  'Quiz F2L-E (atascados)': 'Quiz F2L-E (stuck pieces)',
  'Quiz OLL-1 (cruz amarilla)': 'Quiz OLL-1 (yellow cross)',
  'Quiz OLL-2 (esquinas)': 'Quiz OLL-2 (corners)',
  'Quiz PLL-1 (esquinas)': 'Quiz PLL-1 (corners)',
  'Quiz PLL-2 (aristas)': 'Quiz PLL-2 (edges)',

  // Method: reduced CFOP
  'CFOP reducido': 'Reduced CFOP',
  'Del método principiante al CFOP en el cubo de Rubik: 35 algoritmos (19 de F2L, 10 de OLL y 6 de PLL) y un plan de 6 semanas.':
    "From the beginner method to CFOP on the Rubik's cube: 35 algorithms (19 F2L, 10 OLL and 6 PLL) and a 6-week plan.",
  'El CFOP es el método de casi todos los speedcubers. Su nombre viene de sus 4 pasos: cruz, F2L, OLL y PLL.':
    'CFOP is the method almost every speedcuber uses. Its name comes from its 4 steps: cross, F2L, OLL and PLL.',
  'Esta guía es tu primer CFOP, para cuando ya resuelves el cubo con el método principiante. La cruz es la misma, y los otros 3 pasos suman **35 algoritmos**, en vez de los 119 del CFOP completo.':
    "This is your first version of CFOP, for when you can already solve the cube with the beginner method. The cross is the same, and the other 3 steps add up to **35 algorithms**, instead of full CFOP's 119.",
  '## Las 3 fases': '## The 3 phases',
  '1. **F2L:** junta cada esquina blanca con su arista y mete el par en su ranura (19 casos).':
    '1. **F2L:** join each white corner with its edge and insert the pair into its slot (19 cases).',
  '2. **OLL en 2 pasos:** deja amarilla toda la cara de arriba, primero con la cruz (3 casos) y luego con las esquinas (7), el paso llamado OCLL.':
    '2. **2-look OLL:** make the whole top face yellow in 2 steps, first with the cross (3 cases), then with the corners (7), the step called OCLL.',
  '3. **PLL en 2 pasos:** pon cada pieza de arriba en su sitio, primero las esquinas (2 casos) y luego las aristas (4).':
    '3. **2-look PLL:** put each top piece in its place in 2 steps, first the corners (2 cases), then the edges (4).',
  '## Cada algoritmo, en 4 etapas': '## Four stages for each algorithm',
  '1. **Aprender:** pártelo en gatillos y hazlo despacio 5 veces, mirándolo. Sigue cuando te salga sin mirar.':
    '1. **Learn:** split it into triggers and do it slowly 5 times while reading it. Move on when you can do it without looking.',
  '2. **Repetir:** haz su preparación y el algoritmo 20 veces. Sigue cuando te salgan 10 seguidas sin error.':
    '2. **Drill:** do its setup and the algorithm 20 times. Move on when you get 10 in a row without a mistake.',
  '3. **Reconocer:** haz la preparación y un giro `U` al azar. Sigue cuando lo reconozcas y lo resuelvas en menos de 3 s.':
    '3. **Recognize:** do the setup and a random `U` move. Move on when you can recognize the case and solve it in under 3 s.',
  '4. **Integrar:** úsalo en resoluciones cronometradas. Está listo cuando te salga bien 5 veces.':
    "4. **Integrate:** use it in timed solves. It's ready once you've done it right 5 times.",
  '## Sesión tipo: 30 a 40 min': '## Typical session: 30 to 40 min',
  '1. **Calentamiento (5 min):** repite 3 veces cada algoritmo que ya sabes.': '1. **Warm-up (5 min):** repeat each algorithm you already know 3 times.',
  '2. **Nuevos (15 min):** aprende 2 o 3 algoritmos y llévalos de la etapa 1 a la 3.':
    '2. **New ones (15 min):** learn 2 or 3 algorithms and take them from stage 1 to 3.',
  '3. **Resoluciones (15 min):** haz 12 completas y anota tus medias de 5 y de 12 (ao5 y ao12).':
    '3. **Solves (15 min):** do 12 full solves and write down your average of 5 and average of 12 (ao5 and ao12).',
  'Repasa cada algoritmo nuevo al día siguiente, a los 3 días y a los 7. Si uno te falla, refuérzalo y **no añadas otro** esa sesión.':
    "Review each new algorithm the next day, after 3 days and after 7. If you mess one up, go over it again and **don't add another** that session.",
  'Sostén el cubo con la **cruz blanca abajo**, el amarillo arriba y el verde al frente. El naranja queda a la derecha.':
    'Hold the cube with the **white cross on the bottom**, yellow facing up and green facing front. Orange ends up on the right.',
  "Los casos de F2L usan la ranura de **adelante a la derecha**: gira el cubo entero (con `y`, `y'` o `y2`) para tener ahí la que vas a resolver.":
    "The F2L cases use the **front-right** slot: rotate the whole cube (with `y`, `y'` or `y2`) to bring the one you're solving there.",
  '## Giros': '## Moves',
  '- `r` y `f`: giros de dos capas, la cara y la capa del medio a la vez.': '- `r` and `f`: wide moves, the face and the middle layer together.',
  '- `M`: la capa del medio, entre `L` y `R`. Gira en el mismo sentido que `L`.': '- `M`: the middle layer, between `L` and `R`. It turns the same way as `L`.',
  "- `y'`: gira el cubo entero en el sentido de `U'`. El rojo queda al frente.": "- `y'`: rotates the whole cube the way `U'` turns. Red ends up facing front.",
  "- **AUF:** el giro de `U` (`U`, `U'` o `U2`) antes o después de un algoritmo.": "- **AUF:** the `U` move (`U`, `U'` or `U2`) before or after an algorithm.",
  '## Gatillos': '## Triggers',
  "Los algoritmos repiten trozos cortos, los **gatillos**, como `R U R'` o `R U R' U'`. Haz cada gatillo como un solo gesto.":
    "Algorithms reuse short chunks of moves called **triggers**, like `R U R'` or `R U R' U'`. Do each trigger as a single motion.",
  '## Plan B': '## Plan B',
  'Algunos casos traen una segunda opción, más fácil al principio: solo `R`, `U` y `F`, o gatillos que ya conoces. Úsala mientras dominas la principal.': "Some cases come with a second option, easier at first: only `R`, `U` and `F`, or triggers you already know. Use it until you've mastered the main one.",
  '## Figuras': '## Diagrams',
  '- **F2L:** el cubo visto desde arriba, adelante y a la derecha. Lo que no importa sale en gris.': "- **F2L:** the cube seen from above and to the front right. Anything that doesn't matter is gray.",
  '- **OLL y PLL:** la cara amarilla vista desde arriba. El frente es el borde inferior de la figura. Las barritas son las pegatinas de los lados, y en PLL las flechas dicen a dónde va cada pieza.':
    '- **OLL and PLL:** the yellow face seen from above. The front is at the bottom of the diagram. The little bars are the side stickers, and in PLL the arrows show where each piece goes.',
  'El plan dura 6 semanas, con 5 sesiones de 30 a 40 min por semana. Si vas rápido, adelántate. Si no llegas a la meta de una semana, repítela.':
    "The plan lasts 6 weeks, with 5 sessions of 30 to 40 min a week. If you're going fast, move ahead. If you don't reach a week's goal, repeat that week.",
  '- **Semana 1 (8 casos nuevos):** los grupos A y B del F2L. Antes, prueba los 19 casos y apunta los que ya sabes. Planea la cruz en la inspección y hazla en 8 giros o menos. Pasa cuando hayas anotado tu media de 12 (ao12) inicial y te salgan A y B sin mirar los algoritmos.':
    "- **Week 1 (8 new cases):** groups A and B of F2L. First, try the 19 cases and write down the ones you already know. Plan the cross during inspection and do it in 8 moves or fewer. Move on when you've written down your starting average of 12 (ao12) and can do A and B without looking at the algorithms.",
  '- **Semana 2 (5 casos nuevos):** la cruz amarilla del OLL (Línea, L y Punto) y el grupo C del F2L. Mientras metes el último par, mira qué forma hacen las aristas con el amarillo arriba (Línea, L o Punto). Pasa cuando hagas la cruz amarilla en menos de 3 s.':
    '- **Week 2 (5 new cases):** the yellow cross of OLL (Line, L and Dot) and group C of F2L. While you insert the last pair, look at the edges with yellow facing up and spot their shape (Line, L or Dot). Move on when you can do the yellow cross in under 3 s.',
  '- **Semana 3 (8 casos nuevos):** Sune, Antisune, H y Pi, de las esquinas del OLL, y el grupo D del F2L. Cuenta las esquinas con el amarillo arriba sin girar el cubo. Pasa cuando reconozcas esos 4 casos en menos de 2 s.':
    '- **Week 3 (8 new cases):** Sune, Antisune, H and Pi, from the OLL corners, and group D of F2L. Count the corners with yellow facing up without rotating the cube. Move on when you recognize those 4 cases in under 2 s.',
  '- **Semana 4 (8 casos nuevos):** los casos U, L y T de las esquinas del OLL, y el grupo E del F2L. Haz todas las resoluciones con el OLL en 2 pasos. Pasa cuando ya no uses el método principiante para la cara amarilla.':
    '- **Week 4 (8 new cases):** the U, L and T cases from the OLL corners, and group E of F2L. Do every solve with 2-look OLL. Move on when you no longer use the beginner method for the yellow face.',
  '- **Semana 5 (4 casos nuevos):** la T-perm y la Y-perm, para las esquinas del PLL, y Ua y Ub, para las aristas. Busca los faros girando solo la capa de arriba. Pasa cuando reconozcas el caso de las esquinas en menos de 3 s.':
    '- **Week 5 (4 new cases):** the T-perm and the Y-perm, for the PLL corners, and Ua and Ub, for the edges. Look for headlights by turning only the top layer. Move on when you recognize the corner case in under 3 s.',
  '- **Semana 6 (2 casos nuevos):** la H-perm y la Z-perm, para las aristas del PLL. Repasa todo y haz 50 resoluciones en la semana. Terminas cuando tu ao12 sea al menos un 20 % mejor que la de la semana 1.':
    "- **Week 6 (2 new cases):** the H-perm and the Z-perm, for the PLL edges. Review everything and do 50 solves during the week. You're done when your ao12 is at least 20% better than in week 1.",
  '## Metas al terminar la semana 6': '## Goals at the end of week 6',
  'Busca estos tiempos por paso: cruz en menos de 4 s, F2L en menos de 25 s, OLL en menos de 7 s y PLL en menos de 7 s.':
    'Aim for these times per step: cross in under 4 s, F2L in under 25 s, OLL in under 7 s and PLL in under 7 s.',
  'Mídelos una vez por semana con 5 resoluciones a tu ritmo normal. En «Opciones», pon 4 en «Fases por resolución» y toca el cronómetro al terminar cada paso.':
    'Measure them once a week with 5 solves at your normal pace. In "Options", set "Phases per solve" to 4 and tap the timer as you finish each step.',

  // Phases
  'Fase 1: F2L': 'Phase 1: F2L',
  '**Meta:** las dos primeras capas resueltas: cada esquina blanca con su arista, juntas en su ranura.': '**Goal:** the first two layers solved: each white corner with its edge, together in their slot.',
  '**Casos:** 19, todos en la ranura de adelante a la derecha. Empieza por el grupo A.': '**Cases:** 19, all in the front-right slot. Start with group A.',
  '## Cómo se hace': '## How to do it',
  '1. Busca una esquina blanca y su arista, que es la que tiene los otros 2 colores de la esquina.': "1. Find a white corner and its edge, which is the one with the corner's other 2 colors.",
  '2. Gira el cubo entero para tener su ranura adelante a la derecha. Es la que está entre los centros de los 2 colores de la arista.':
    "2. Rotate the whole cube so its slot is at the front right. That's the slot between the centers of the edge's 2 colors.",
  '3. Gira `U` para poner la esquina encima de la ranura. Si ya está en la ranura, déjala ahí.': "3. Turn `U` to put the corner above the slot. If it's already in the slot, leave it there.",
  '4. Busca entre los casos de esta fase el que se ve igual y haz su algoritmo.': '4. Find the case in this phase that matches what you see and do its algorithm.',
  '5. Repite con los otros 3 pares hasta completar las dos primeras capas.': '5. Repeat with the other 3 pairs until the first two layers are done.',
  '## Por dónde empezar': '## Where to start',
  'El primer día, haz la preparación de cada uno de los 19 casos e intenta meter el par a tu manera. Apunta los que ya te salen y entrena solo los demás.':
    'On day one, set up each of the 19 cases and try to insert the pair your own way. Write down the ones you can already solve and practice only the rest.',
  "- **Tu caso no está entre estos 19:** resuelve ese par como en el método principiante: primero la esquina, repitiendo `R U R' U'`, y luego la arista. Es más lento, pero siempre funciona.":
    "- **Your case isn't among these 19:** solve that pair as in the beginner method: first the corner, repeating `R U R' U'`, then the edge. It's slower, but it always works.",
  '- **La esquina está en la ranura y no ves tu caso:** gira `U` para mover solo la arista. Puede estar a un giro de E1 o de E2.':
    "- **The corner is in the slot and you don't see your case:** turn `U` to move only the edge. Your case may be one move away from E1 or E2.",
  '- **El par sale separado:** la ranura no estaba adelante a la derecha o la esquina no estaba encima de ella. Vuelve a dejar la ranura adelante a la derecha y la esquina encima. Luego busca el caso que ves ahora y haz su algoritmo.':
    "- **The pair ends up split:** the slot wasn't at the front right or the corner wasn't above it. Bring the slot back to the front right with the corner above it. Then find the case you see now and do its algorithm.",
  '- **Te cuesta girar el cubo en B4, D2 o D4:** usa su Plan B, que hace lo mismo con `F`, sin girar el cubo.':
    '- **Rotating the cube in B4, D2 or D4 is hard for you:** use its Plan B, which does the same with `F`, without rotating the cube.',
  'Grupo A — Inserciones básicas': 'Group A — Basic inserts',
  'El grupo A reúne las 4 inserciones más cortas, de 3 o 4 giros. Son la base de todos los demás casos.':
    'Group A has the 4 shortest inserts, 3 or 4 moves each. All the other cases build on them.',
  'Grupo B — Sin formar par, blanco de lado': 'Group B — Not paired yet, white on the side',
  'La esquina tiene el blanco al frente o a la derecha, y la arista está arriba sin formar par con ella. Sus algoritmos primero juntan las dos piezas y luego meten el par.':
    "The corner has white facing front or right, and the edge is on top but not paired with it. This group's algorithms first join the two pieces, then insert the pair.",
  'Grupo C — Blanco de lado, arista lejos y al revés': 'Group C — White on the side, edge far away and reversed',
  'La arista está arriba, lejos de la esquina, y al revés: su color de lado mira en sentido contrario al mismo color en la esquina. En C1, el naranja de la arista mira a la izquierda, y el de la esquina, a la derecha.':
    "The edge is on top, far from the corner, and reversed: its side color faces the opposite way from the same color on the corner. In C1, the edge's orange faces left, and the corner's orange faces right.",
  'Grupo D — Blanco mirando arriba': 'Group D — White facing up',
  'La esquina tiene el blanco mirando arriba, y la arista también está en la capa de arriba.': 'The corner has white facing up, and the edge is in the top layer too.',
  'Grupo E — Piezas atascadas en la ranura': 'Group E — Pieces stuck in the slot',
  'La esquina, la arista o las dos ya están en la ranura, pero el par no está resuelto. Sus algoritmos primero sacan de la ranura lo que está atascado y luego meten el par.':
    "The corner, the edge or both are already in the slot, but the pair isn't solved. This group's algorithms first take out what's stuck in the slot, then insert the pair.",
  'Orden: **A → B → C → D → E**. El grupo A tiene los casos más cortos, y el E, los más largos.': 'Order: **A → B → C → D → E**. Group A has the shortest cases and group E has the longest.',
  '## Espejo': '## Mirror',
  'Cuando domines un caso en la ranura de adelante a la derecha, practica su espejo en la de adelante a la izquierda:': 'Once you master a case in the front-right slot, practice its mirror in the front-left one:',
  "- Cambia `R` por `L'`, `F` por `F'`, `U` por `U'`, `r` por `l'` e `y'` por `y`. `M` no cambia.": "- Replace `R` with `L'`, `F` with `F'`, `U` with `U'`, `r` with `l'` and `y'` with `y`. `M` doesn't change.",
  "- Ejemplo: `R U R'` pasa a `L' U' L`.": "- Example: `R U R'` becomes `L' U' L`.",
  '## Anticipación': '## Look-ahead',
  'Haz 5 resoluciones lentas por sesión. Mientras metes un par, busca con la vista el siguiente.': 'Do 5 slow solves per session. While you insert one pair, look for the next one.',
  'Fase 2: OLL en 2 pasos': 'Phase 2: 2-look OLL',
  '**Meta:** toda la cara de arriba amarilla. Los colores de los lados aún no importan.': "**Goal:** the whole top face yellow. The side colors don't matter yet.",
  '**Casos:** 10, en 2 pasos: la cruz amarilla (3) y luego las esquinas (7). Empieza por la cruz y, en las esquinas, por Sune y Antisune.':
    '**Cases:** 10, in 2 steps: the yellow cross (3), then the corners (7). Start with the cross and, for the corners, with Sune and Antisune.',
  '1. **Cruz amarilla:** cuenta las aristas con el amarillo arriba y haz su caso.':
    '1. **Yellow cross:** count the edges with yellow facing up and do the matching case.',
  '2. **Esquinas:** cuenta las esquinas con el amarillo arriba y haz su caso.':
    '2. **Corners:** count the corners with yellow facing up and do the matching case.',
  'Antes de cada algoritmo, gira `U` hasta verlo como en su figura.': 'Before each algorithm, turn `U` until the case looks like its diagram.',
  '- **No encuentras tu caso:** gira `U` y vuelve a mirar, porque cada figura muestra el caso desde un solo lado. Mira también el amarillo de los lados, no solo el de arriba.':
    "- **You can't find your case:** turn `U` and look again, because each diagram shows the case from one side only. Look at the yellow on the sides too, not just on top.",
  '- **Ves 1 o 3 aristas con el amarillo arriba, o 3 esquinas:** con el F2L hecho, eso no puede pasar. Vuelve a contar, sin mirar el amarillo de los lados. Si sigue igual, hay una arista volteada o una esquina girada, por ejemplo porque el cubo se desarmó. Ponla bien a mano.':
    "- **You see 1 or 3 edges with yellow facing up, or 3 corners:** with F2L done, that can't happen. Count again, ignoring the yellow on the sides. If it's still the same, there's a flipped edge or a twisted corner, for example because the cube came apart. Fix it by hand.",
  '- **Se rompió el F2L:** el algoritmo salió mal, con un giro de menos o al revés. Rehaz el par roto y repite el algoritmo despacio, gatillo por gatillo.':
    '- **Your F2L broke:** the algorithm went wrong because you missed a move or did one backwards. Redo the broken pair and repeat the algorithm slowly, trigger by trigger.',
  'Paso 1 — Cruz amarilla': 'Step 1 — Yellow cross',
  'En la cruz amarilla, si hay 2 aristas con el amarillo arriba en línea, es la Línea. Si hay 2 que forman una L con el centro, es la L. Si no hay ninguna, es el Punto.':
    "For the yellow cross, if 2 edges with yellow facing up form a line, it's the Line. If 2 form an L with the center, it's the L. If there are none, it's the Dot.",
  'Paso 2 — Esquinas amarillas (OCLL)': 'Step 2 — Yellow corners (OCLL)',
  'Cuenta las esquinas con el amarillo arriba:': 'Count the corners with yellow facing up:',
  '- **Ninguna:** H o Pi.': '- **None:** H or Pi.',
  '- **Una:** Sune o Antisune.': '- **One:** Sune or Antisune.',
  '- **Dos:** el caso U, el T o el L.': '- **Two:** the U, T or L case.',
  '- **Cruz:** aprende la Línea y la L el mismo día, y el Punto al siguiente.': '- **Cross:** learn the Line and the L on the same day, and the Dot the next.',
  '- **Esquinas:** Sune y Antisune → H y Pi → U, L y T. Aprende juntos los casos U y L: son inversos.': "- **Corners:** Sune and Antisune → H and Pi → U, L and T. Learn the U and L cases together: they're inverses.",
  'En las esquinas, empieza por **Sune y Antisune**: salen mucho y comparten gatillos con el caso H.':
    'For the corners, start with **Sune and Antisune**: they come up a lot and share triggers with the H case.',
  'Fase 3: PLL en 2 pasos': 'Phase 3: 2-look PLL',
  '**Meta:** cada pieza de arriba en su sitio. ¡Cubo resuelto!': '**Goal:** each top piece in its place. Cube solved!',
  '**Casos:** 6, en 2 pasos: las esquinas (2) y luego las aristas (4). Empieza por la T-perm.': '**Cases:** 6, in 2 steps: the corners (2), then the edges (4). Start with the T-perm.',
  '1. **Esquinas:** busca **faros**, 2 esquinas de un lado con el mismo color y la arista del medio de otro color. Un lado completo cuenta como faros. Luego haz su caso.':
    '1. **Corners:** look for **headlights**, 2 corners on the same side with the same color and a different-colored edge between them. A solved side counts as headlights. Then do the matching case.',
  '2. **Aristas:** gira `U` hasta alinear las esquinas con sus centros y mira las aristas.': '2. **Edges:** turn `U` to line up the corners with their centers, and look at the edges.',
  '3. Si hay un lado completo, gira el cubo entero hasta dejarlo atrás.': "3. If there's a solved side, rotate the whole cube until it's at the back.",
  '4. Haz el caso de las aristas. Las esquinas siguen alineadas, así que el cubo queda resuelto.': '4. Do the edge case. The corners stay lined up, so the cube ends up solved.',
  '- **No ves faros:** mira los 4 lados, girando `U`. Si ninguno tiene faros ni está completo, es la Y-perm.':
    "- **You don't see headlights:** check all 4 sides by turning `U`. If no side has headlights or is solved, it's the Y-perm.",
  '- **Tras la T-perm, no puedes alinear las 4 esquinas:** seguramente no tenías los faros, o el lado completo, a la izquierda. Vuelve a mirar los 4 lados. Si uno tiene faros o está completo, ponlo a la izquierda y repite la T-perm. Si ninguno tiene faros ni está completo, haz la Y-perm.':
    "- **After the T-perm, you can't line up all 4 corners:** you probably didn't have the headlights, or the solved side, on the left. Look at all 4 sides again. If one has headlights or is solved, put it on the left and do the T-perm again. If no side has headlights or is solved, do the Y-perm.",
  '- **Hiciste Ua en vez de Ub, o al revés:** no se rompe nada, y el lado completo sigue atrás. Mira otra vez la arista del frente y haz el que toque.':
    '- **You did Ua instead of Ub, or the other way around:** nothing breaks, and the solved side is still at the back. Look at the front edge again and do the case that matches.',
  '- **La arista del frente y la de la derecha están intercambiadas:** es la Z-perm, vista desde otro lado. Gira el cubo entero con `y` para verla como en su figura.':
    "- **The front and right edges are swapped:** it's the Z-perm, seen from another side. Rotate the whole cube with `y` so it matches its diagram.",
  'Paso 1 — Esquinas': 'Step 1 — Corners',
  'Busca faros, o un lado completo, en los 4 lados. Si los hay en uno solo, es la T-perm. Si no los hay en ninguno, es la Y-perm. Si los hay en los 4, las esquinas ya están bien.':
    "Look for headlights, or a solved side, on all 4 sides. If only one side has them, it's the T-perm. If none has them, it's the Y-perm. If all 4 have them, the corners are already done.",
  'Paso 2 — Aristas': 'Step 2 — Edges',
  'Con las esquinas alineadas, busca un lado completo. Si lo hay, es Ua o Ub. Si no hay ninguno, es H o Z.':
    "With the corners lined up, look for a solved side. If there is one, it's Ua or Ub. If there's none, it's H or Z.",
  'Orden: **T-perm → Y-perm → Ua y Ub juntos → H → Z**.': 'Order: **T-perm → Y-perm → Ua and Ub together → H → Z**.',
  'Empieza por la T-perm, que es la que más sale. Aprende juntos Ua y Ub: son inversos.': "Start with the T-perm, the one that comes up most. Learn Ua and Ub together: they're inverses.",
};
