// "CFOP completo": the 41 F2L, 57 OLL and 21 PLL cases. Each phase lives in its own file under cfopFull/.
import type { Localized } from '../i18n.ts';
import type { Method } from './types.ts';
import { f2lPhase } from './cfopFull/f2l.ts';
import { ollPhase } from './cfopFull/oll.ts';
import { pllPhase } from './cfopFull/pll.ts';

const es = (text: string): Localized => ({ es: text });

export const cfopFull: Method = {
  id: 'cfop-completo',
  name: es('CFOP completo'),
  summary: es('Todos los casos: 41 de F2L, 57 de OLL y 21 de PLL.'),
  description: es(
    [
      'Cruz, F2L, OLL y PLL, cada uno con **un solo algoritmo por caso**.',
      'La cruz está en la guía «La cruz blanca» (enlace «Paso previo»).',
      'Si vienes del CFOP reducido, ya sabes 19 casos de F2L, 9 de OLL y 6 de PLL. Cada fase marca cuáles.',
    ].join('\n'),
  ),
  orientation: es(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** El naranja queda a la derecha.',
      'Todas las mezclas parten del cubo resuelto en esa posición.',
    ].join('\n'),
  ),
  notation: es(
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
  ),
  phases: [f2lPhase, ollPhase, pllPhase],
};
