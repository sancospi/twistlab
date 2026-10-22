// "CFOP completo": the 41 F2L, 57 OLL and 21 PLL cases. Each phase lives in its own file under cfopFull/.
import type { Localized } from '../i18n.ts';
import type { Method } from './types.ts';
import { f2lPhase } from './cfopFull/f2l.ts';
import { ollPhase } from './cfopFull/oll.ts';
import { pllPhase } from './cfopFull/pll.ts';

const tr = (es: string, en: string): Localized => ({ es, en });

export const cfopFull: Method = {
  id: 'cfop-completo',
  name: tr('CFOP completo', 'Full CFOP'),
  summary: tr('Todos los casos: 41 de F2L, 57 de OLL y 21 de PLL.', 'Every case: 41 F2L, 57 OLL and 21 PLL.'),
  description: tr(
    [
      'Cruz, F2L, OLL y PLL, cada uno con **un solo algoritmo por caso**.',
      'La cruz está en la guía «La cruz blanca» (enlace «Paso previo»).',
      'Si vienes del CFOP reducido, ya sabes 19 casos de F2L, 9 de OLL y 6 de PLL. Cada fase marca cuáles.',
    ].join('\n'),
    [
      'Cross, F2L, OLL and PLL, each with **a single algorithm per case**.',
      'The cross is in the guide "The white cross" (the "Previous step" link).',
      'If you come from the reduced CFOP, you already know 19 F2L cases, 9 OLL and 6 PLL. Each phase marks which ones.',
    ].join('\n'),
  ),
  orientation: tr(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** El naranja queda a la derecha.',
      'Todas las mezclas parten del cubo resuelto en esa posición.',
    ].join('\n'),
    [
      '**White cross on the bottom, yellow on top and green in front.** Orange ends up on the right.',
      'Every scramble starts from the solved cube in that position.',
    ].join('\n'),
  ),
  notation: tr(
    [
      '## Giros',
      '- `R`, `L`, `U`, `D`, `F` y `B`: una cara, en sentido horario mirándola de frente.',
      "- `R'`: antihorario. `R2`: media vuelta.",
      '- `r`, `l`, `u`, `d`, `f`: la cara y la capa del medio, en el mismo sentido que la cara.',
      '- `M`: capa del medio entre `L` y `R`, gira como `L`. `S`: capa del medio entre `F` y `B`, gira como `F`.',
      '- `x` gira todo el cubo como `R`; `y`, como `U`. No mueven piezas: solo cambian la cara que tienes al frente.',
      "- **AUF**: giro de `U` (`U`, `U'` o `U2`) antes o después de un algoritmo.",
      '## Figuras',
      '- **F2L:** vista desde arriba-adelante-derecha. Lo que no importa está en gris.',
      '- **OLL y PLL:** cara amarilla vista desde arriba, con el frente abajo. Las barritas son las pegatinas laterales de la capa superior.',
      '- **PLL:** las flechas muestran a dónde va cada pieza.',
    ].join('\n'),
    [
      '## Turns',
      '- `R`, `L`, `U`, `D`, `F` and `B`: one face, clockwise as you look at it head-on.',
      "- `R'`: counterclockwise. `R2`: half turn.",
      '- `r`, `l`, `u`, `d`, `f`: the face and the middle layer, in the same direction as the face.',
      '- `M`: middle layer between `L` and `R`, turns like `L`. `S`: middle layer between `F` and `B`, turns like `F`.',
      "- `x` rotates the whole cube like `R`; `y`, like `U`. They don't move pieces: they only change which face is in front of you.",
      "- **AUF**: a `U` turn (`U`, `U'` or `U2`) before or after an algorithm.",
      '## Diagrams',
      '- **F2L:** seen from the top-front-right. What does not matter is gray.',
      '- **OLL and PLL:** yellow face seen from above, with the front at the bottom. The little bars are the side stickers of the top layer.',
      '- **PLL:** the arrows show where each piece goes.',
    ].join('\n'),
  ),
  phases: [f2lPhase, ollPhase, pllPhase],
};
