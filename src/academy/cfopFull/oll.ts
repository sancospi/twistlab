// CFOP completo, OLL: los 57 casos de OLL (ids cfopc-oll-01…57), agrupados por forma como en SpeedCubeDB.
import type { Localized } from '../../i18n.ts';
import { invertTokens, tokenize } from '../../notation.ts';
import { scdbUrl } from '../scdb.ts';
import type { Case, Group, Phase } from '../types.ts';

const es = (text: string): Localized => ({ es: text });

// Main algorithm = SpeedCubeDB's #1 (fetched 2026-10-21) without the leading y the site sometimes starts with: the
// case is drawn from the angle the algorithm starts at, so the AUF does the rotation's job. Extras ([rank, alg]) are
// the site's #2–#4 with at least 10 votes, minus the same algorithm (or another extra) done with the other hand (y2 and l for r), each with
// the U turn it needs to start from the main one's angle. cfop.validate.test.ts checks every one in the simulator.
function oll(n: number, name: string, recognition: string, alg: string, alts: [number, string][] = [], note?: string, code = `OLL ${n}`): Case {
  return {
    id: `cfopc-oll-${String(n).padStart(2, '0')}`,
    code,
    name: es(name),
    recognition: es(recognition),
    stage: 'oll-corners',
    algs: [
      { id: 'main', alg, source: 'speedcubedb', rank: 1 },
      ...alts.map(([rank, a]) => ({ id: `scdb-${rank}`, alg: a, source: 'speedcubedb' as const, rank })),
    ],
    setup: invertTokens(tokenize(alg)).join(' '),
    scdb: { set: 'OLL', id: String(n), url: scdbUrl('OLL', String(n)) },
    ...(note ? { note: es(note) } : {}),
  };
}
/** The 7 OCLL cases keep their common name as code, with the wording of CFOP reducido. */
const ocll = (code: string, n: number, recognition: string, alg: string, alts: [number, string][], note?: string): Case =>
  oll(n, `OLL ${n}`, `Cruz hecha. ${recognition}`, alg, alts, note, code);
const inverse = (n: number) => `Es el inverso del OLL ${n}: la mezcla de uno es el algoritmo del otro.`;
const SUNE_NOTE = 'Sune y Antisune son inversas: la mezcla de una es el algoritmo de la otra. Apréndelas primero: salen en muchos solves y comparten gatillos con la H.';
const UL_NOTE = 'U y L son inversas: la mezcla de la L es el algoritmo de la U. D gira la capa de abajo en sentido horario, mirándola desde abajo.';

// "A los lados" = the yellow stickers on the side faces of the top layer, as drawn (front at the bottom).
const CASES: Case[] = [
  oll(1, 'Punto', 'Arriba: solo el centro. A los lados: al frente y atrás, la arista; a la izquierda y a la derecha, las 3.', "R U2 R2 F R F' U2 R' F R F'", [[2, "U R U' R2 D' r U' r' D R2 U R'"], [3, "f R U R' U' R f' U' r' U' R U M'"]]),
  oll(2, 'Punto', 'Arriba: solo el centro. A los lados: al frente, las 3; a la izquierda y a la derecha, la arista y la esquina de atrás; atrás, la arista.', "R U' R2 D' r U r' D R2 U R'", [[2, "U F R U R' U' S R U R' U' f'"], [3, "U2 r U r' U2 R U2 R' U2 r U' r'"], [4, "U F R U R' U' F' f R U R' U' f'"]]),
  oll(3, 'Punto', 'Arriba: esquina adelante-der. A los lados: al frente, la arista; a la izquierda, la esquina de adelante y la arista; a la derecha, la arista y la esquina de atrás; atrás, la esquina izquierda y la arista.', "f R U R' U' f' U' F R U R' U' F'", [[2, "U2 R' F2 R2 U2 R' F R U2 R2 F2 R"], [3, "U r' R2 U R' U r U2 r' U M'"], [4, "U M R U R' U r U2 r' U M'"]]),
  oll(4, 'Punto', 'Arriba: esquina atrás-der. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la arista y la esquina de atrás; a la derecha, la esquina de adelante y la arista; atrás, la arista.', "R' F2 R2 U2 R' F' R U2 R2 F2 R", [[2, "f R U R' U' f' U F R U R' U' F'"], [3, "U R' F R F' U' S R' U' R U R S'"], [4, "U2 F U R U' R' F' U' F R U R' U' F'"]]),
  oll(5, 'Cuadrado', 'Arriba: aristas derecha y adelante; esquina adelante-der. A los lados: a la izquierda, la esquina de adelante y la arista; a la derecha, la esquina de atrás; atrás, la esquina izquierda y la arista.', "r' U2 R U R' U r", [[3, "U2 R' F2 r U r' F R"]], inverse(8)),
  oll(6, 'Cuadrado', 'Arriba: aristas atrás y derecha; esquina atrás-der. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la arista y la esquina de atrás; a la derecha, la esquina de adelante.', "r U2 R' U' R U' r'", [], inverse(7)),
  oll(7, 'Relámpago', 'Arriba: aristas atrás e izquierda; esquina adelante-izq. A los lados: al frente, la arista y la esquina derecha; a la derecha, la arista y la esquina de atrás; atrás, la esquina izquierda.', "r U R' U R U2 r'", [], inverse(6)),
  oll(8, 'Relámpago', 'Arriba: aristas izquierda y adelante; esquina atrás-izq. A los lados: al frente, la esquina izquierda; a la derecha, la esquina de adelante y la arista; atrás, la arista y la esquina derecha.', "r' U' R U' R' U2 r", [[3, "U2 R U2 R' U2 R' F R F'"], [4, "U2 R' F' r U' r' F2 R"]], inverse(5)),
  oll(9, 'Pez', 'Arriba: aristas atrás e izquierda; esquina adelante-der. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la esquina de atrás; a la derecha, la arista; atrás, la esquina derecha.', "R U R' U' R' F R2 U R' U' F'", [[2, "U' R U2 R' U' S' R U' R' S"]]),
  oll(10, 'Pez', 'Arriba: aristas izquierda y adelante; esquina atrás-der. A los lados: al frente, la esquina derecha; a la izquierda, la esquina de adelante; a la derecha, la arista; atrás, la esquina izquierda y la arista.', "R U R' U R' F R F' R U2 R'", [[2, "U F U F' R' F R U' R' F' R"]]),
  oll(11, 'Relámpago', 'Arriba: aristas derecha y adelante; esquina adelante-izq. A los lados: al frente, la esquina derecha; a la izquierda, la arista; a la derecha, la esquina de atrás; atrás, la esquina izquierda y la arista.', "r' R2 U R' U R U2 R' U M'", [[2, "U2 r U R' U R' F R F' R U2 r'"], [3, "S R U R' U R U2 R' U2 S'"], [4, "M R U R' U R U2 R' U M'"]]),
  oll(12, 'Relámpago', 'Arriba: aristas atrás y derecha; esquina atrás-izq. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la arista; a la derecha, la esquina de adelante; atrás, la esquina derecha.', "M' R' U' R U' R' U2 R U' M", [[2, "U F R U R' U' F' U F R U R' U' F'"], [3, "S R' U' R U' R' U2 R U2 S'"]]),
  oll(13, 'Caballo', 'Arriba: línea izquierda–derecha; esquina adelante-izq. A los lados: al frente, la arista y la esquina derecha; a la derecha, la esquina de atrás; atrás, la esquina izquierda y la arista.', "F U R U2 R' U' R U R' F'", [[2, "F U R U' R2 F' R U R U' R'"], [3, "r U' r' U' r U r' F' U F"]]),
  oll(14, 'Caballo', 'Arriba: línea izquierda–derecha; esquina adelante-der. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la esquina de atrás; atrás, la arista y la esquina derecha.', "R' F R U R' F' R F U' F'", [[2, "r U R' U' r' F R2 U R' U' F'"]]),
  oll(15, 'Caballo', 'Arriba: línea izquierda–derecha; esquina adelante-der. A los lados: al frente, la arista; a la izquierda, la esquina de adelante; a la derecha, la esquina de atrás; atrás, la esquina izquierda y la arista.', "r' U' r R' U' R U r' U r", [[3, "r' U' M' U' R U r' U r"], [4, "U2 R' F' R L' U' L U R' F R"]]),
  oll(16, 'Caballo', 'Arriba: línea izquierda–derecha; esquina atrás-der. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la esquina de atrás; a la derecha, la esquina de adelante; atrás, la arista.', "r U r' R U R' U' r U' r'", [[2, "r U M U R' U' r U' r'"]]),
  oll(17, 'Punto', 'Arriba: esquinas atrás-izq y adelante-der. A los lados: al frente y a la derecha, la arista; a la izquierda, la esquina de adelante y la arista; atrás, la arista y la esquina derecha.', "R U R' U R' F R F' U2 R' F R F'", [[2, "U2 F R' F' R U S' R U' R' S"], [3, "U2 F R' F' R2 r' U R U' R' U' M'"]]),
  oll(18, 'Punto', 'Arriba: esquinas atrás-der y adelante-der. A los lados: a la izquierda, las 3; en los demás, la arista.', "R U2 R2 F R F' U2 M' U R U' r'", [[2, "U' r U R' U R U2 r2 U' R U' R' U2 r"], [3, "F S' R U' R' S R U2 R' U' F'"], [4, "U' R D r' U' r D' R' U' R2 F R F' R"]]),
  oll(19, 'Punto', 'Arriba: esquinas atrás-der y adelante-der. A los lados: al frente y atrás, la esquina izquierda y la arista; a la izquierda y a la derecha, la arista.', "S' R U R' S U' R' F R F'", [[2, "U' M U R U R' U' M' R' F R F'"], [3, "U' R' U2 F R U R' U' F2 U2 F R"]]),
  oll(20, 'Punto', 'Arriba: las 4 esquinas. A los lados: la arista en cada uno.', "r U R' U' M2 U R U' R' U' M'", [[2, "M' U2 M U2 M' U M U2 M' U2 M"], [3, "S' R U R' S U' M' U R U' r'"], [4, "S R' U' R U R U R U' R' S'"]]),
  ocll('H', 21, '0 esquinas arriba; dos amarillos a la izquierda y dos a la derecha.', "R U R' U R U' R' U R U2 R'", [[2, "U R U2 R' U' R U R' U' R U' R'"], [3, "U F R U R' U' R U R' U' R U R' U' F'"], [4, "R' U' R U' R' U R U' R' U2 R"]]),
  ocll('Pi', 22, '0 esquinas arriba; dos amarillos a la izquierda, y a la derecha uno al frente y otro atrás.', "R U2 R2 U' R2 U' R2 U2 R", [[2, "R' U2 R2 U R2 U R2 U2 R'"], [3, "f R U R' U' S' R U R' U' F'"]]),
  ocll('U', 23, '2 esquinas arriba (las de atrás); dos amarillos al frente.', "R2 D R' U2 R D' R' U2 R'", [[2, "U2 R2 D' R U2 R' D R U2 R"], [3, "R U R' U R U2 R2 U' R U' R' U2 R"]], UL_NOTE),
  ocll('T', 24, '2 esquinas arriba (las de la derecha); a la izquierda, un amarillo al frente y otro atrás.', "r U R' U' r' F R F'", [[2, "U2 R' F' r U R U' r' F"], [3, "U R U R D R' U' R D' R2"], [4, "U' x' R U R' D R U' R' D' x"]]),
  ocll('L', 25, '2 esquinas arriba en diagonal (atrás-izq y adelante-der); la de adelante-izq muestra amarillo al frente.', "R U2 R D R' U2 R D' R2", [[2, "U F' r U R' U' r' F R"], [3, "F R' F' r U R U' r'"], [4, "x R' U R D' R' U' R D x'"]], UL_NOTE),
  ocll('Antisune', 26, '1 esquina arriba, atrás-der; la de adelante-izq muestra amarillo al frente.', "R U2 R' U' R U' R'", [[2, "U' R' U' R U' R' U2 R"]], SUNE_NOTE),
  ocll('Sune', 27, '1 esquina arriba, adelante-izq; la de adelante-der muestra amarillo al frente.', "R U R' U R U2 R'", [[2, "U' R' U2 R U R' U R"]], SUNE_NOTE),
  oll(28, 'Esquinas listas', 'Arriba: aristas atrás e izquierda; las 4 esquinas. A los lados: al frente y a la derecha, la arista.', "r U R' U' M U R U' R'", [[2, "R' F R S R' F' R S'"], [3, "r U R' U' r' R U R U' R'"], [4, "U2 M' U M U2 M' U M"]], inverse(57)),
  oll(29, 'Raro', 'Arriba: aristas izquierda y adelante; esquinas atrás-izq y atrás-der. A los lados: a la izquierda, la esquina de adelante; a la derecha, la esquina de adelante y la arista; atrás, la arista.', "r2 D' r U r' D r2 U' r' U' r", [[2, "U R U R' U' R U' R' F' U' F R U R'"], [3, "U S' R U R' U' R' F R F' U S"], [4, "M U R U R' U' R' F R F' M'"]]),
  oll(30, 'Raro', 'Arriba: aristas atrás e izquierda; esquinas adelante-izq y adelante-der. A los lados: al frente, la arista; a la izquierda, la esquina de atrás; a la derecha, la arista y la esquina de atrás.', "F U R U2 R' U' R U2 R' U' F'", [[2, "U r' D' r U' r' D r2 U' r' U r U r'"], [3, "F R' F R2 U' R' U' R U R' F2"], [4, "U' S' R' U' R f R' U R U' F'"]]),
  oll(31, 'Forma de P', 'Arriba: aristas atrás y derecha; esquinas atrás-der y adelante-der. A los lados: al frente, la esquina izquierda y la arista; a la izquierda, la arista; atrás, la esquina izquierda.', "R' U' F U R U' R' F' R", [[2, "U2 S' L' U' L U L F' L' f"], [3, "U S R U R' U' f' U' F"]], inverse(40)),
  oll(32, 'Forma de P', 'Arriba: aristas derecha y adelante; esquinas atrás-der y adelante-der. A los lados: al frente, la esquina izquierda; a la izquierda, la arista; atrás, la esquina izquierda y la arista.', "S R U R' U' R' F R f'", [[2, "U2 L U F' U' L' U L F L'"]]),
  oll(33, 'Forma de T', 'Arriba: línea izquierda–derecha; esquinas atrás-der y adelante-der. A los lados: al frente y atrás, la esquina izquierda y la arista.', "R U R' U' R' F R F'", [], inverse(37)),
  oll(34, 'Forma de C', 'Arriba: línea adelante–atrás; esquinas atrás-der y adelante-der. A los lados: al frente y atrás, la esquina izquierda; a la izquierda y a la derecha, la arista.', "f R f' U' r' U' R U M'", [[2, "U R U R2 U' R' F R U R U' F'"], [3, "U' F R U R' U' R' F' r U R U' r'"], [4, "U R U R' U' B' R' F R F' B"]]),
  oll(35, 'Pez', 'Arriba: aristas derecha y adelante; esquinas atrás-izq y adelante-der. A los lados: al frente, la esquina izquierda; a la izquierda y atrás, la arista; a la derecha, la esquina de atrás.', "R U2 R2 F R F' R U2 R'"),
  oll(36, 'Forma de W', 'Arriba: aristas atrás e izquierda; esquinas atrás-der y adelante-izq. A los lados: al frente, la arista y la esquina derecha; a la izquierda, la esquina de atrás; a la derecha, la arista.', "R U R2 F' U' F U R2 U2 R'", [[2, "U L' U' L U' L' U L U L F' L' F"], [3, "U R U R' F' R U R' U' R' F R U' R' F R F'"], [4, "U' R U R' U' F' U2 F U R U R'"]]),
  oll(37, 'Pez', 'Arriba: aristas atrás e izquierda; esquinas atrás-izq y adelante-der. A los lados: al frente, la esquina izquierda y la arista; a la derecha, la arista y la esquina de atrás.', "F R' F' R U R U' R'", [[2, "F R U' R' U' R U R' F'"]], inverse(33)),
  oll(38, 'Forma de W', 'Arriba: aristas atrás e izquierda; esquinas atrás-der y adelante-izq. A los lados: al frente, la arista; a la derecha, la esquina de adelante y la arista; atrás, la esquina izquierda.', "R U R' U R U' R' U' R' F R F'"),
  oll(39, 'Relámpago', 'Arriba: línea izquierda–derecha; esquinas atrás-der y adelante-izq. A los lados: al frente, la arista y la esquina derecha; a la izquierda, la esquina de atrás; atrás, la arista.', "f' r U r' U' r' F r S", [[2, "R U R' F' U' F U R U2 R'"], [3, "U2 L F' L' U' L U F U' L'"], [4, "f' L F L' U' L' U L S"]]),
  oll(40, 'Relámpago', 'Arriba: línea izquierda–derecha; esquinas atrás-izq y adelante-der. A los lados: al frente, la arista; a la izquierda, la esquina de adelante; atrás, la arista y la esquina derecha.', "R' F R U R' U' F' U R", [[2, "U2 f R' F' R U R U' R' S'"]], inverse(31)),
  oll(41, 'Raro', 'Arriba: aristas atrás e izquierda; esquinas adelante-izq y adelante-der. A los lados: al frente y a la derecha, la arista; atrás, las 2 esquinas.', "R U R' U R U2 R' F R U R' U' F'", [[2, "F U R2 D R' U' R D' R2 F'"], [3, "U S U' R' F' U' F U R S'"], [4, "U2 M U' F' L' U' L U F M'"]]),
  oll(42, 'Raro', 'Arriba: aristas izquierda y adelante; esquinas atrás-izq y atrás-der. A los lados: al frente, las 2 esquinas; a la derecha y atrás, la arista.', "R' U' R U' R' U2 R F R U R' U' F'", [[2, "U F S' R U R' U' F' U S"], [3, "U R' F R F' R' F R F' R U R' U' R U R'"], [4, "U R' U' F2 u' R U R' D R2 B"]]),
  oll(43, 'Forma de P', 'Arriba: aristas atrás e izquierda; esquinas atrás-izq y atrás-der. A los lados: al frente, las 3; a la derecha, la arista.', "R' U' F' U F R", [[2, "U F' U' L' U L F"], [3, "U' f' L' U' L U f"]]),
  oll(44, 'Forma de P', 'Arriba: aristas derecha y adelante; esquinas atrás-der y adelante-der. A los lados: a la izquierda, las 3; atrás, la arista.', "f R U R' U' f'", [[2, "U2 F U R U' R' F'"]], 'Ya lo conoces: es la L de la cruz amarilla del OLL en 2 pasos.'),
  oll(45, 'Forma de T', 'Arriba: línea izquierda–derecha; esquinas atrás-der y adelante-der. A los lados: al frente y atrás, la arista; a la izquierda, las 2 esquinas.', "F R U R' U' F'", [[2, "U R' F' U' F U R"]], 'Ya lo conoces: es la Línea de la cruz amarilla del OLL en 2 pasos.'),
  oll(46, 'Forma de C', 'Arriba: línea adelante–atrás; esquinas atrás-izq y adelante-izq. A los lados: a la izquierda, la arista; a la derecha, las 3.', "R' U' R' F R F' U R"),
  oll(47, 'L pequeña', 'Arriba: aristas atrás e izquierda. A los lados: al frente, la arista; a la izquierda, la esquina de adelante; a la derecha, la esquina de adelante y la arista; atrás, las 2 esquinas.', "F R' F' R U2 R U' R' U R U2 R'", [[2, "U F' L' U' L U L' U' L U F"], [3, "U R' U' R' F R F' R' F R F' U R"]]),
  oll(48, 'L pequeña', 'Arriba: aristas atrás e izquierda. A los lados: al frente, la arista y la esquina derecha; a la izquierda, las 2 esquinas; a la derecha, la arista; atrás, la esquina derecha.', "F R U R' U' R U R' U' F'", [], inverse(51)),
  oll(49, 'L pequeña', 'Arriba: aristas atrás y derecha. A los lados: al frente, la arista y la esquina derecha; a la izquierda, las 3; atrás, la esquina derecha.', "r U' r2 U r2 U r2 U' r", [], inverse(50)),
  oll(50, 'L pequeña', 'Arriba: aristas derecha y adelante. A los lados: al frente, la esquina derecha; a la izquierda, las 3; atrás, la arista y la esquina derecha.', "r' U r2 U' r2 U' r2 U r'", [[2, "U2 R' F R2 B' R2 F' R2 B R'"], [3, "U' R U2 R' U' R U' R' F R U R' U' F'"]], inverse(49)),
  oll(51, 'Línea', 'Arriba: línea izquierda–derecha. A los lados: al frente y atrás, la esquina izquierda y la arista; a la derecha, las 2 esquinas.', "F U R U' R' U R U' R' F'", [[2, "U2 f R U R' U' R U R' U' f'"]], inverse(48)),
  oll(52, 'Línea', 'Arriba: línea adelante–atrás. A los lados: al frente y atrás, la esquina derecha; a la izquierda, las 3; a la derecha, la arista.', "R' F' U' F U' R U R' U R", [[2, "U2 R U R' U R U' B U' B' R'"], [3, "U2 R U R' U R d' R U' R' F'"], [4, "U2 R U R' U R U' y R U' R' F'"]]),
  oll(53, 'L pequeña', 'Arriba: aristas derecha y adelante. A los lados: a la izquierda, las 3; a la derecha, las 2 esquinas; atrás, la arista.', "r' U' R U' R' U R U' R' U2 r", [[3, "U r' U2 R U R' U' R U R' U r"]]),
  oll(54, 'L pequeña', 'Arriba: aristas atrás y derecha. A los lados: al frente, la arista; a la izquierda, las 3; a la derecha, las 2 esquinas.', "r U R' U R U' R' U R U2 r'", [[2, "U' r U2 R' U' R U R' U' R U' r'"]]),
  oll(55, 'Línea', 'Arriba: línea izquierda–derecha. A los lados: al frente y atrás, las 3.', "R' F U R U' R2 F' R2 U R' U' R", [[2, "R' F R U R U' R2 F' R2 U' R' U R U R'"], [3, "U R U2 R2 U' R U' R' U2 F R F'"], [4, "U r U2 R2 F R F' U2 r' F R F'"]]),
  oll(56, 'Línea', 'Arriba: línea izquierda–derecha. A los lados: al frente y atrás, la arista; a la izquierda y a la derecha, las 2 esquinas.', "r U r' U R U' R' U R U' R' r U' r'", [[2, "r U r' U R U' R' M' U R U2 r'"], [3, "F R U R' U' R F' r U R' U' r'"], [4, "r' U' r U' R' U R U' R' U R r' U r"]]),
  oll(57, 'Esquinas listas', 'Arriba: línea izquierda–derecha; las 4 esquinas. A los lados: al frente y atrás, la arista.', "R U R' U' M' U R U' r'", [[2, "U R U' R' S' R U R' S"]], inverse(28)),
];

const pick = (ns: number[]) => ns.map((n) => CASES.find((c) => c.scdb?.id === String(n))!);
const group = (slug: string, name: string, description: string, ns: number[]): Group => ({
  id: `cfopc-oll-${slug}`,
  name: es(name),
  description: es(description),
  cases: pick(ns),
});

export const ollPhase: Phase = {
  id: 'cfopc-oll',
  name: es('OLL'),
  description: es(
    [
      'Deja toda la cara de arriba amarilla **con un solo algoritmo**. 57 casos.',
      '## En 2 pasos o completo',
      '- **En 2 pasos:** el del CFOP reducido. Cruz amarilla y luego esquinas: 9 algoritmos (el Punto es la Línea seguida de la L).',
      '- **Completo:** un algoritmo por caso. Ahorras un paso y una pausa de reconocimiento, a cambio de 48 algoritmos nuevos (ya sabes 9: los 7 OCLL, la Línea y la L).',
      'Si aparece un caso que no sabes, resuélvelo en 2 pasos.',
      '## Empieza por el OCLL',
      'Los 7 casos con la cruz ya hecha (OCLL) son el paso 2 del OLL en 2 pasos. Si vienes del CFOP reducido, ya los sabes: domínalos primero.',
      '## Reconocer por la forma',
      '1. Mira las aristas de arriba: cruz, línea, ángulo (la L del OLL en 2 pasos) o ninguna (punto).',
      '2. Mira qué esquinas tienen el amarillo arriba. Con las aristas, dibujan la forma que da el grupo.',
      '3. Dentro del grupo, mira los amarillos de los lados.',
      '«A los lados» son las pegatinas amarillas de las caras laterales de la capa de arriba, como en la figura (frente abajo).',
    ].join('\n'),
  ),
  diagram: 'top',
  groups: [
    group('ocll', 'Cruz hecha (OCLL)', 'La cruz amarilla ya está; faltan las esquinas. Cuenta las que tienen el amarillo arriba:\n- 0 → H o Pi\n- 1 → Sune o Antisune\n- 2 → U, T o L', [27, 26, 21, 22, 23, 24, 25]),
    group('t', 'Formas de T', 'Línea de aristas y las 2 esquinas de un extremo: forman una fila de 3 que cruza la línea. El 45 es la Línea del OLL en 2 pasos.', [45, 33]),
    group('p', 'Formas de P', 'Dos aristas en ángulo y 2 esquinas que forman una fila de 3 con una de ellas. El 44 es la L del OLL en 2 pasos.', [44, 43, 32, 31]),
    group('c', 'Formas de C', 'Línea de aristas y las 2 esquinas del lado paralelo, con hueco en medio.', [34, 46]),
    group('w', 'Formas de W', 'Dos aristas en ángulo y 2 esquinas en escalera.', [36, 38]),
    group('cuadrado', 'Cuadrados', 'Cuadrado 2×2: dos aristas en ángulo y la esquina entre ellas.', [5, 6]),
    group('relampago', 'Relámpagos', 'Forma de rayo.\n- **Pequeños (7, 8, 11 y 12):** dos aristas en ángulo y 1 esquina pegada a una, fuera del ángulo.\n- **Grandes (39 y 40):** una línea y 2 esquinas en diagonal.', [7, 8, 11, 12, 39, 40]),
    group('pez', 'Peces', 'Dos aristas en ángulo y la esquina opuesta en diagonal (la cola). En el 35 y el 37 también está arriba la esquina del ángulo.', [9, 10, 35, 37]),
    group('caballo', 'Saltos de caballo', 'Línea de aristas y una sola esquina arriba, como el salto del caballo en ajedrez.', [13, 14, 15, 16]),
    group('l', 'L pequeñas', 'Solo dos aristas en ángulo, sin esquinas arriba.', [47, 48, 49, 50, 53, 54]),
    group('linea', 'Líneas', 'Solo una línea de aristas, sin esquinas arriba.', [51, 52, 55, 56]),
    group('esquinas', 'Esquinas listas', 'Las 4 esquinas ya tienen el amarillo arriba; faltan 2 aristas.', [28, 57]),
    group('raros', 'Raros', 'Dos aristas en ángulo y las 2 esquinas del lado sin arista, con hueco en medio. Difíciles de reconocer: fíjate en los lados.', [29, 30, 41, 42]),
    group('punto', 'Puntos', 'Ninguna arista arriba: solo el centro y, a veces, esquinas. De los más largos.', [1, 2, 3, 4, 17, 18, 19, 20]),
  ],
  progression: es(
    [
      'Orden: **OCLL → T, P y C → W, cuadrados y relámpagos → peces y saltos de caballo → L pequeñas y líneas → esquinas listas y raros → puntos**.',
      '- Aprende también el inverso de cada caso, aunque sea de otro grupo: la mezcla de uno es el algoritmo del otro (5 y 8, 6 y 7, 31 y 40, 33 y 37, 48 y 51, 49 y 50, 28 y 57).',
      '- Mientras no sepas un caso, resuélvelo en 2 pasos: cruz amarilla y luego OCLL.',
      '- Deja los puntos para el final: mientras tanto, usa el Punto del OLL en 2 pasos.',
    ].join('\n'),
  ),
  quizzes: [],
};
