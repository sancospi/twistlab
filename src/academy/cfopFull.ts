// "CFOP completo": the 41 F2L, 57 OLL and 21 PLL cases. Each phase lives in its own file under cfopFull/.
import { tr } from '../i18n.ts';
import type { Method } from './types.ts';
import { f2lPhase } from './cfopFull/f2l.ts';
import { ollPhase } from './cfopFull/oll.ts';
import { pllPhase } from './cfopFull/pll.ts';

export const cfopFull: Method = {
  id: 'cfop-completo',
  name: tr('CFOP completo', 'Full CFOP', 'CFOP completo'),
  summary: tr(
    'Un algoritmo para cada caso del CFOP: 41 de F2L, 57 de OLL y 21 de PLL, con cómo reconocerlos y en qué orden aprenderlos.',
    'One algorithm for every CFOP case: 41 F2L, 57 OLL and 21 PLL, plus how to recognize them and what order to learn them in.',
    'Um algoritmo para cada caso do CFOP: 41 de F2L, 57 de OLL e 21 de PLL, além de como reconhecê-los e em que ordem aprendê-los.',
  ),
  description: tr(
    [
      'La versión completa del CFOP: **un algoritmo para cada caso** del F2L, el OLL y el PLL. Es para quien ya resuelve con el CFOP reducido y quiere ir más rápido: el OLL y el PLL pasan de 2 pasos a 1.',
      '## Los 4 pasos',
      '1. **Cruz:** tiene su propia guía, «La cruz blanca».',
      '2. **F2L:** las dos primeras capas, par a par. 41 casos.',
      '3. **OLL:** toda la cara amarilla, de una vez. 57 casos.',
      '4. **PLL:** cada pieza de arriba a su sitio, de una vez. 21 casos.',
      '## Cómo aprenderlo',
      '- **Si vienes del CFOP reducido,** ya sabes 19 casos de F2L, 9 de OLL y 6 de PLL (el Punto no cuenta: no es un algoritmo nuevo, sino la Línea seguida de la L). Cada fase te dice cuáles.',
      '- **Un grupo a la vez,** en el orden de «Progresión» de cada fase.',
      '- **Mientras no sepas un caso,** resuélvelo como en el CFOP reducido: el OLL y el PLL en 2 pasos.',
    ].join('\n'),
    [
      "The full version of CFOP: **one algorithm for every case** of F2L, OLL and PLL. It's for anyone who already solves with reduced CFOP and wants to go faster: OLL and PLL go from 2 steps (2-look) to 1.",
      '## The 4 steps',
      '1. **Cross:** it has its own guide, "The white cross".',
      '2. **F2L:** the first two layers, pair by pair. 41 cases.',
      '3. **OLL:** the whole yellow face, in one go. 57 cases.',
      '4. **PLL:** every top piece into place, in one go. 21 cases.',
      '## How to learn it',
      "- **If you come from reduced CFOP,** you already know 19 F2L cases, 9 OLL and 6 PLL (the Dot doesn't count: it isn't a new algorithm, just the Line followed by the L). Each phase tells you which.",
      "- **One group at a time,** in the order of each phase's \"Progression\".",
      '- **Until you know a case,** solve it as in reduced CFOP: OLL and PLL in 2 looks.',
    ].join('\n'),
    [
      'A versão completa do CFOP: **um algoritmo para cada caso** do F2L, do OLL e do PLL. É para quem já resolve com o CFOP reduzido e quer ir mais rápido: o OLL e o PLL passam de 2 passos para 1.',
      '## Os 4 passos',
      '1. **Cruz:** tem seu próprio guia, "A cruz branca".',
      '2. **F2L:** as duas primeiras camadas, par a par. 41 casos.',
      '3. **OLL:** toda a face amarela, de uma vez. 57 casos.',
      '4. **PLL:** cada peça de cima no lugar, de uma vez. 21 casos.',
      '## Como aprender',
      '- **Se você vem do CFOP reduzido,** já sabe 19 casos de F2L, 9 de OLL e 6 de PLL (o Ponto não conta: não é um algoritmo novo, e sim a Linha seguida do L). Cada fase diz quais.',
      '- **Um grupo de cada vez,** na ordem da "Progressão" de cada fase.',
      '- **Enquanto não souber um caso,** resolva como no CFOP reduzido: o OLL e o PLL em 2 passos.',
    ].join('\n'),
  ),
  orientation: tr(
    [
      'Sostén el cubo con la **cruz blanca abajo**, el amarillo arriba y el verde al frente. El naranja queda a la derecha.',
      'Los casos de F2L son para la ranura de **adelante a la derecha**. En el OLL y el PLL, gira `U` hasta ver el caso como en la figura.',
    ].join('\n'),
    [
      'Hold the cube with the **white cross on the bottom**, yellow on top and green facing front. Orange ends up on the right.',
      'The F2L cases are for the **front-right** slot. In OLL and PLL, turn `U` until you see the case as in the diagram.',
    ].join('\n'),
    [
      'Segure o cubo com a **cruz branca embaixo**, o amarelo em cima e o verde para a frente. O laranja fica à direita.',
      'Os casos de F2L são para o slot da **frente à direita**. No OLL e no PLL, gire `U` até ver o caso como na figura.',
    ].join('\n'),
  ),
  notation: tr(
    [
      '## Giros',
      "- `R`, `L`, `U`, `D`, `F` y `B`: un cuarto de vuelta de esa cara, en sentido horario mirándola de frente. `R'` gira al revés y `R2` da media vuelta.",
      '- `r`, `l`, `u`, `d` y `f`: la cara y la capa del medio juntas, en el sentido de la cara.',
      '- `M`: la capa del medio entre `L` y `R`, en el sentido de `L`. `S`: la del medio entre `F` y `B`, en el sentido de `F`.',
      '- `x` gira el cubo entero como `R`. `y` lo gira como `U`. No mueven piezas: solo cambian cómo sostienes el cubo.',
      "- **AUF:** el giro de `U` (`U`, `U'` o `U2`) que hace falta antes o después de un algoritmo.",
      '## Figuras',
      '- **F2L:** el cubo visto en diagonal, con las caras de arriba, del frente y de la derecha. En gris, lo que no importa.',
      '- **OLL y PLL:** la cara amarilla vista desde arriba. La parte inferior del dibujo es el frente. Las barritas son las pegatinas de los lados.',
      '- **PLL:** las flechas dicen a dónde va cada pieza.',
    ].join('\n'),
    [
      '## Moves',
      "- `R`, `L`, `U`, `D`, `F` and `B`: a quarter turn of that face, clockwise as you look at it head-on. `R'` turns the other way and `R2` is a half turn.",
      '- `r`, `l`, `u`, `d` and `f`: the face and the middle layer together, in the direction of the face.',
      '- `M`: the middle layer between `L` and `R`, in the direction of `L`. `S`: the middle one between `F` and `B`, in the direction of `F`.',
      "- `x` rotates the whole cube like `R`. `y` rotates it like `U`. They don't move any pieces: they only change how you hold the cube.",
      "- **AUF:** the `U` move (`U`, `U'` or `U2`) needed before or after an algorithm.",
      '## Diagrams',
      "- **F2L:** the cube seen at an angle, showing the top, front and right faces. Anything in gray doesn't matter.",
      '- **OLL and PLL:** the yellow face seen from above. The bottom of the drawing is the front. The little bars are the side stickers.',
      '- **PLL:** the arrows show where each piece goes.',
    ].join('\n'),
    [
      '## Movimentos',
      "- `R`, `L`, `U`, `D`, `F` e `B`: um quarto de volta dessa face, no sentido horário olhando para ela de frente. `R'` gira ao contrário e `R2` dá meia-volta.",
      '- `r`, `l`, `u`, `d` e `f`: a face e a camada do meio juntas, no sentido da face.',
      '- `M`: a camada do meio entre `L` e `R`, no sentido de `L`. `S`: a do meio entre `F` e `B`, no sentido de `F`.',
      '- `x` gira o cubo inteiro como `R`. `y` o gira como `U`. Não movem peças: só mudam como você segura o cubo.',
      "- **AUF:** o movimento de `U` (`U`, `U'` ou `U2`) necessário antes ou depois de um algoritmo.",
      '## Figuras',
      '- **F2L:** o cubo visto na diagonal, com as faces de cima, da frente e da direita. O que não importa aparece em cinza.',
      '- **OLL e PLL:** a face amarela vista de cima. A parte inferior do desenho é a frente. As barrinhas são os adesivos dos lados.',
      '- **PLL:** as setas mostram para onde vai cada peça.',
    ].join('\n'),
  ),
  phases: [f2lPhase, ollPhase, pllPhase],
};
