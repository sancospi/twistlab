// "CFOP completo": the 41 F2L, 57 OLL and 21 PLL cases. Each phase lives in its own file under cfopFull/.
import { tr } from '../i18n.ts';
import type { Method } from './types.ts';
import { f2lPhase } from './cfopFull/f2l.ts';
import { ollPhase } from './cfopFull/oll.ts';
import { pllPhase } from './cfopFull/pll.ts';

export const cfopFull: Method = {
  id: 'cfop-completo',
  name: tr('CFOP completo', 'Full CFOP', 'CFOP completo'),
  summary: tr('Todos los casos: 41 de F2L, 57 de OLL y 21 de PLL.', 'Every case: 41 F2L, 57 OLL and 21 PLL.', 'Todos os casos: 41 de F2L, 57 de OLL e 21 de PLL.'),
  description: tr(
    [
      'La versión completa del CFOP: **un algoritmo por caso** en el F2L, el OLL y el PLL.',
      '## Los 4 pasos',
      '1. **Cruz:** tiene su propia guía, «La cruz blanca».',
      '2. **F2L:** las dos primeras capas, par a par. 41 casos.',
      '3. **OLL:** toda la cara amarilla, de una vez. 57 casos.',
      '4. **PLL:** cada pieza de arriba a su sitio, de una vez. 21 casos.',
      '## Cómo aprenderlo',
      '- **Si vienes del CFOP reducido,** ya sabes 19 casos de F2L, 9 de OLL y 6 de PLL: cada fase te dice cuáles.',
      '- **Un grupo a la vez,** en el orden de «Progresión» de cada fase.',
      '- **Mientras no sepas un caso,** resuélvelo como en el CFOP reducido: el OLL y el PLL en 2 pasos.',
    ].join('\n'),
    [
      'The full version of CFOP: **one algorithm per case** for F2L, OLL and PLL.',
      '## The 4 steps',
      '1. **Cross:** it has its own guide, "The white cross".',
      '2. **F2L:** the first two layers, pair by pair. 41 cases.',
      '3. **OLL:** the whole yellow face, in one go. 57 cases.',
      '4. **PLL:** every top piece into place, in one go. 21 cases.',
      '## How to learn it',
      '- **If you come from reduced CFOP,** you already know 19 F2L cases, 9 OLL and 6 PLL: each phase tells you which.',
      "- **One group at a time,** in the order of each phase's \"Progression\".",
      '- **Until you know a case,** solve it as in reduced CFOP: OLL and PLL in 2 steps.',
    ].join('\n'),
    [
      'A versão completa do CFOP: **um algoritmo por caso** no F2L, no OLL e no PLL.',
      '## Os 4 passos',
      '1. **Cruz:** tem seu próprio guia, "A cruz branca".',
      '2. **F2L:** as duas primeiras camadas, par a par. 41 casos.',
      '3. **OLL:** toda a face amarela, de uma vez. 57 casos.',
      '4. **PLL:** cada peça de cima no lugar, de uma vez. 21 casos.',
      '## Como aprender',
      '- **Se você vem do CFOP reduzido,** já sabe 19 casos de F2L, 9 de OLL e 6 de PLL: cada fase diz quais.',
      '- **Um grupo de cada vez,** na ordem da "Progressão" de cada fase.',
      '- **Enquanto não souber um caso,** resolva como no CFOP reduzido: o OLL e o PLL em 2 passos.',
    ].join('\n'),
  ),
  orientation: tr(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente**; el naranja queda a la derecha.',
      'Los casos de F2L son para la ranura de **adelante a la derecha**. En el OLL y el PLL, gira `U` hasta ver el caso como en la figura.',
    ].join('\n'),
    [
      '**White cross on the bottom, yellow on top and green in front**; orange ends up on the right.',
      'The F2L cases are for the **front-right** slot. In OLL and PLL, turn `U` until you see the case as in the figure.',
    ].join('\n'),
    [
      '**Cruz branca embaixo, amarelo em cima e verde na frente**; o laranja fica à direita.',
      'Os casos de F2L são para o slot da **frente à direita**. No OLL e no PLL, gire `U` até ver o caso como na figura.',
    ].join('\n'),
  ),
  notation: tr(
    [
      '## Giros',
      "- `R`, `L`, `U`, `D`, `F` y `B`: un cuarto de vuelta de esa cara, en sentido horario mirándola de frente. `R'`, al revés; `R2`, media vuelta.",
      '- `r`, `l`, `u`, `d` y `f`: la cara y la capa del medio juntas, en el sentido de la cara.',
      '- `M`: la capa del medio entre `L` y `R`, en el sentido de `L`. `S`: la del medio entre `F` y `B`, en el sentido de `F`.',
      '- `x` gira el cubo entero como `R`; `y`, como `U`. No mueven piezas: solo cambian qué cara queda al frente.',
      "- **AUF:** el giro de `U` (`U`, `U'` o `U2`) que hace falta antes o después de un algoritmo.",
      '## Figuras',
      '- **F2L:** el cubo desde arriba, adelante y a la derecha. En gris, lo que no importa.',
      '- **OLL y PLL:** la cara amarilla desde arriba, con el frente abajo. Las barritas son las pegatinas de los lados.',
      '- **PLL:** las flechas dicen a dónde va cada pieza.',
    ].join('\n'),
    [
      '## Turns',
      "- `R`, `L`, `U`, `D`, `F` and `B`: a quarter turn of that face, clockwise as you look at it head-on. `R'`, the other way; `R2`, a half turn.",
      '- `r`, `l`, `u`, `d` and `f`: the face and the middle layer together, in the direction of the face.',
      '- `M`: the middle layer between `L` and `R`, in the direction of `L`. `S`: the middle one between `F` and `B`, in the direction of `F`.',
      '- `x` rotates the whole cube like `R`; `y`, like `U`. They move no pieces: they only change which face is in front.',
      "- **AUF:** the `U` turn (`U`, `U'` or `U2`) needed before or after an algorithm.",
      '## Diagrams',
      "- **F2L:** the cube from the top, front and right. In gray, what doesn't matter.",
      '- **OLL and PLL:** the yellow face from above, with the front at the bottom. The little bars are the side stickers.',
      '- **PLL:** the arrows show where each piece goes.',
    ].join('\n'),
    [
      '## Movimentos',
      "- `R`, `L`, `U`, `D`, `F` e `B`: um quarto de volta dessa face, no sentido horário olhando-a de frente. `R'`, ao contrário; `R2`, meia volta.",
      '- `r`, `l`, `u`, `d` e `f`: a face e a camada do meio juntas, no sentido da face.',
      '- `M`: a camada do meio entre `L` e `R`, no sentido de `L`. `S`: a do meio entre `F` e `B`, no sentido de `F`.',
      '- `x` gira o cubo inteiro como `R`; `y`, como `U`. Não movem peças: só mudam qual face fica na frente.',
      "- **AUF:** o movimento de `U` (`U`, `U'` ou `U2`) que falta antes ou depois de um algoritmo.",
      '## Figuras',
      '- **F2L:** o cubo visto de cima, da frente e da direita. Em cinza, o que não importa.',
      '- **OLL e PLL:** a face amarela vista de cima, com a frente embaixo. As barrinhas são os adesivos dos lados.',
      '- **PLL:** as setas mostram para onde vai cada peça.',
    ].join('\n'),
  ),
  phases: [f2lPhase, ollPhase, pllPhase],
};
