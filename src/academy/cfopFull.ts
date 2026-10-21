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
      'El CFOP completo: cruz, F2L, OLL y PLL en un solo paso cada uno.',
      'La cruz tiene su propia guía, «La cruz blanca» (el enlace «Paso previo» de arriba).',
      'Si vienes del CFOP reducido, ya sabes 19 casos de F2L, 9 de OLL y 6 de PLL: cada fase te dice cuáles son.',
    ].join('\n'),
  ),
  orientation: es(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** Así, el naranja queda a la derecha.',
      'Todas las mezclas parten del cubo resuelto en esa posición.',
    ].join('\n'),
  ),
  notation: es(
    [
      '## Movimientos',
      '- `R`, `L`, `U`, `D`, `F` y `B` giran una cara en sentido horario, mirándola de frente.',
      "- Con apóstrofo el giro es antihorario (`R'`); con 2 es media vuelta (`R2`).",
      '- En minúscula (`r`, `l`, `u`, `d`, `f`) mueven 2 capas a la vez: la cara más la capa del medio, en el mismo sentido que la cara.',
      '- `M` es la capa del medio entre `L` y `R`, y gira como `L`. `S` es la del medio entre `F` y `B`, y gira como `F`.',
      '- `x` gira todo el cubo como `R`; `y`, como `U`. No mueven ninguna pieza: solo cambian qué cara tienes al frente.',
      "- **AUF** es el giro de la capa superior (`U`, `U'` o `U2`) que va antes o después de un algoritmo.",
      '## Figuras',
      '- **F2L:** ves el cubo desde arriba-adelante-derecha. Lo que no importa está en gris.',
      '- **OLL y PLL:** ves la cara amarilla desde arriba, con el frente abajo. Las barritas alrededor son las pegatinas laterales de la capa superior.',
      '- **PLL:** las flechas indican a dónde va cada pieza.',
    ].join('\n'),
  ),
  phases: [f2lPhase, ollPhase, pllPhase],
};
