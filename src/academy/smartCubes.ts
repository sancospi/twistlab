// "Cubo inteligente: cuál comprar" (/cubos-inteligentes): which smart cubes work with TwistLab and what changes between
// them, for people who search for exactly that. Only what the app itself knows (smart-cube.ts and its libraries): the
// brands it connects, which report their state, which can have a gyroscope, what each device needs. No prices nor
// specs: those change and aren't ours to check. Pure: seo.ts prerenders it, view.ts draws it in the app.
import { doc, tr, type Localized } from '../i18n.ts';
import { routePath } from '../router.ts';

export interface ArticleSection {
  id: string;
  title: Localized;
  body: Localized;
  more?: { href: string; label: Localized }[];
}

const cube = { href: routePath({ mod: 'cube' }), label: tr('Conectar tu cubo en TwistLab', 'Connect your cube to TwistLab', 'Conectar seu cubo ao TwistLab') };
const timer = { href: routePath({ mod: 'solve' }), label: tr('El Resolver: cronómetro y análisis de cada resolución', 'Solve: the timer and the analysis of every solve', 'O Resolver: cronômetro e análise de cada resolução') };

export const smartCubes = {
  name: tr('Cubo inteligente: cuál comprar para entrenar', 'Smart cube: which one to buy for training', 'Cubo inteligente: qual comprar para treinar'),
  summary: tr(
    'Qué cubo inteligente comprar para entrenar con TwistLab: las marcas que funcionan, qué cambia entre ellas y qué necesitas en el móvil o el ordenador.',
    'Which smart cube to buy for training with TwistLab: the brands that work, how they differ and what you need on your phone or computer.',
    'Qual cubo inteligente comprar para treinar com o TwistLab: as marcas que funcionam, o que muda entre elas e do que você precisa no celular ou computador.',
  ),
  nav: tr('Partes de la guía', 'Guide sections', 'Partes do guia'),
  sections: [
    {
      id: 'que-es',
      title: tr('Qué es un cubo inteligente', 'What a smart cube is', 'O que é um cubo inteligente'),
      body: doc(
        [
          'Un cubo inteligente es un cubo de velocidad con sensores que envía **cada giro por Bluetooth** a tu móvil u ordenador. Se gira como cualquier otro, y también puedes usarlo sin conectarlo.',
          'Si lo conectas a TwistLab:',
          '- El cronómetro arranca con tu primer giro y se para por sí solo cuando resuelves el cubo.',
          '- La app parte cada resolución en los pasos del método CFOP: **cruz, pares del F2L, OLL y PLL**. Te da el tiempo, los giros y las pausas de cada paso, y te dice **qué mejorar**.',
          '- La app te guía giro a giro al mezclar. En la Academia, sigue tus algoritmos y te corrige al practicar.',
          '- En la pantalla «Cubo», el apartado «En tu cubo» te dice en qué caso de F2L, OLL o PLL está tu cubo y con qué algoritmo resolverlo.',
        ],
        [
          'A smart cube is a speed cube with built-in sensors. It sends **every move over Bluetooth** to your phone or computer. You turn it like any other cube, and you can also use it without connecting it.',
          'If you connect it to TwistLab:',
          '- The timer starts with your first move and stops by itself when you solve the cube.',
          '- The app splits every solve into the steps of the CFOP method: **cross, F2L pairs, OLL and PLL**. It gives you the time, the moves and the pauses of each step, and tells you **what to improve**.',
          '- The app guides you move by move as you scramble. In the Academy, it tracks your algorithms and corrects you as you practice.',
          '- On the "Cube" screen, the "On your cube" panel tells you which F2L, OLL or PLL case your cube is in and which algorithm solves it.',
        ],
        [
          'Um cubo inteligente é um cubo de velocidade que tem sensores e envia **cada movimento por Bluetooth** para o seu celular ou computador. Ele gira como qualquer outro cubo, e você também pode usá-lo sem conectar.',
          'Se você conectá-lo ao TwistLab:',
          '- O cronômetro começa com o seu primeiro movimento e para sozinho quando você resolve o cubo.',
          '- O app divide cada resolução nas etapas do método CFOP: **cruz, pares do F2L, OLL e PLL**. Ele mostra o tempo, os movimentos e as pausas de cada etapa e diz **o que melhorar**.',
          '- O app guia você movimento a movimento ao embaralhar. Na Academia, ele acompanha os seus algoritmos e corrige você enquanto pratica.',
          '- Na tela "Cubo", a seção "No seu cubo" mostra em qual caso de F2L, OLL ou PLL o seu cubo está e com qual algoritmo resolvê-lo.',
        ],
      ),
      more: [timer],
    },
    {
      id: 'marcas',
      title: tr('Marcas que funcionan con TwistLab', 'Brands that work with TwistLab', 'Marcas que funcionam com o TwistLab'),
      body: doc(
        [
          'TwistLab se conecta a cubos inteligentes de estas marcas:',
          '- **GAN**: informan su estado (dónde está cada color), y algunos modelos tienen giroscopio.',
          '- **MoYu** (WeiLong AI): informan su estado, y algunos modelos tienen giroscopio.',
          '- **QiYi** (incluido el X-Man Tornado V4 i): informan su estado, y algunos modelos tienen giroscopio.',
          '- **GiiKER**: informan su estado al conectarlos (no mientras giras) y no tienen giroscopio.',
          '- **GoCube** y **Rubik’s Connected**: tienen giroscopio, pero no informan su estado.',
          'Cualquiera sirve para cronometrar, analizar tus resoluciones y practicar algoritmos. En «Qué mirar al elegir» verás qué cambia si el cubo informa su estado o tiene giroscopio.',
        ],
        [
          'TwistLab connects to smart cubes from these brands:',
          '- **GAN**: they report their state (where every color is), and some models have a gyroscope.',
          '- **MoYu** (WeiLong AI): they report their state, and some models have a gyroscope.',
          '- **QiYi** (including the X-Man Tornado V4 i): they report their state, and some models have a gyroscope.',
          '- **GiiKER**: they report their state when you connect them (not while you turn) and have no gyroscope.',
          '- **GoCube** and **Rubik’s Connected**: they have a gyroscope, but they don’t report their state.',
          'Any of them works for timing, analyzing your solves and practicing algorithms. The "What to look for when choosing" section explains what changes if the cube reports its state or has a gyroscope.',
        ],
        [
          'O TwistLab se conecta a cubos inteligentes destas marcas:',
          '- **GAN**: informam o estado (onde está cada cor), e alguns modelos têm giroscópio.',
          '- **MoYu** (WeiLong AI): informam o estado, e alguns modelos têm giroscópio.',
          '- **QiYi** (incluindo o X-Man Tornado V4 i): informam o estado, e alguns modelos têm giroscópio.',
          '- **GiiKER**: informam o estado ao conectar (não enquanto você gira) e não têm giroscópio.',
          '- **GoCube** e **Rubik’s Connected**: têm giroscópio, mas não informam o estado.',
          'Qualquer um serve para cronometrar, analisar as suas resoluções e praticar algoritmos. Na seção "O que olhar na hora de escolher", você vê o que muda se o cubo informa o estado ou tem giroscópio.',
        ],
      ),
    },
    {
      id: 'que-mirar',
      title: tr('Qué mirar al elegir', 'What to look for when choosing', 'O que olhar na hora de escolher'),
      body: doc(
        [
          'Para entrenar, lo que más importa es que el cubo informe su estado, como los de GAN, MoYu y QiYi. El giroscopio es un extra.',
          '## Si informa su estado',
          'Un cubo que **informa su estado** le dice a la app dónde está cada color mientras giras. Si la app pierde un giro, se corrige sola. GiiKER lo informa al conectarlo, pero no mientras giras.',
          'GoCube y Rubik’s Connected no lo informan: la app da por hecho que están resueltos al conectarlos. Si no lo estaban, o si el cubo de la pantalla deja de coincidir con el tuyo, resuelve tu cubo a mano. Luego toca «Marcar como resuelto». También puedes dar dos vueltas enteras seguidas a la cara amarilla, en el mismo sentido y en menos de 4 s.',
          '## El giroscopio',
          'El **giroscopio** es un sensor que nota cómo sostienes el cubo. Con él, cuando giras el cubo entero en la mano, el de la pantalla gira igual. Sin él, giras el de la pantalla con las flechas. No hace falta para cronometrar ni para analizar tus resoluciones.',
          '## Lo demás, como en cualquier cubo de velocidad',
          'Para el tacto, los imanes, el peso y el precio no hay reglas especiales: elige el que más te guste girar. Si ya tienes un cubo inteligente de una marca compatible, pruébalo con TwistLab antes de comprar otro.',
        ],
        [
          'For training, what matters most is that the cube reports its state, like GAN, MoYu and QiYi cubes do. The gyroscope is an extra.',
          '## Whether it reports its state',
          'A cube that **reports its state** tells the app where every color is while you turn. If the app misses a move, it corrects itself. GiiKER cubes report it when you connect them, but not while you turn.',
          'GoCube and Rubik’s Connected don’t report it: the app assumes they’re solved when you connect them. If they weren’t, or if the on-screen cube stops matching yours, solve your cube by hand. Then tap "Mark as solved". You can also give the yellow face two full turns in a row, in the same direction, within 4 s.',
          '## The gyroscope',
          'The **gyroscope** is a sensor that detects how you hold the cube. With it, when you rotate the whole cube in your hand, the on-screen cube rotates the same way. Without it, you rotate the on-screen cube with the arrows. You don’t need it for timing or for analyzing your solves.',
          '## Everything else is the same as with any speed cube',
          'There are no special rules for feel, magnets, weight or price: pick the one you enjoy turning most. If you already have a smart cube from a supported brand, try it with TwistLab before buying another.',
        ],
        [
          'Para treinar, o que mais importa é que o cubo informe o estado, como os da GAN, MoYu e QiYi. O giroscópio é um extra.',
          '## Se o cubo informa o estado',
          'Um cubo que **informa o estado** diz ao app onde está cada cor enquanto você gira. Se o app perder um movimento, ele se corrige sozinho. O GiiKER informa o estado ao conectar, mas não enquanto você gira.',
          'GoCube e Rubik’s Connected não informam: o app supõe que estão resolvidos ao conectar. Se não estavam, ou se o cubo da tela deixar de bater com o seu, resolva o seu cubo à mão. Depois toque em "Marcar como resolvido". Você também pode dar duas voltas inteiras seguidas na face amarela, no mesmo sentido, em menos de 4 s.',
          '## O giroscópio',
          'O **giroscópio** é um sensor que percebe como você segura o cubo. Com ele, quando você gira o cubo inteiro na mão, o da tela gira igual. Sem ele, você gira o da tela com as setas. Não é necessário para cronometrar nem para analisar as suas resoluções.',
          '## O resto é como em qualquer cubo de velocidade',
          'Quanto ao toque, aos ímãs, ao peso e ao preço, não há regras especiais: escolha o que você mais gostar de girar. Se você já tem um cubo inteligente de uma marca compatível, teste-o no TwistLab antes de comprar outro.',
        ],
      ),
    },
    {
      id: 'dispositivos',
      title: tr('En qué móvil u ordenador', 'Which phone or computer you need', 'Em qual celular ou computador funciona'),
      body: doc(
        [
          'TwistLab se conecta al cubo con el **Bluetooth del navegador** (Web Bluetooth), que no todos los navegadores tienen:',
          '- **Android, Windows, Mac y Linux**: con Chrome, Edge u Opera. En Linux, puede que antes tengas que activar Web Bluetooth en chrome://flags.',
          '- **iPhone y iPad**: ni Safari ni Chrome pueden conectar un cubo. Instala **Bluefy**, un navegador gratuito con Bluetooth, y abre TwistLab en él.',
          '- **Firefox**: no sirve, porque no tiene Web Bluetooth.',
          'Con algunos cubos de GAN, MoYu o QiYi, TwistLab te pide su **dirección MAC** la primera vez. Es un código que identifica cada cubo, con la forma AA:BB:CC:DD:EE:FF. La app la recuerda y no vuelve a pedírtela. Si no la sabes, en la pantalla «Cubo» abre «¿Cómo encuentro la MAC de mi cubo?».',
          'Al tocar «Conectar cubo», el navegador te muestra una lista de cubos. Si el tuyo no aparece, gíralo un poco para despertarlo. Si sigue sin aparecer, puede estar conectado a otra app, por ejemplo la de su marca. Un cubo solo se conecta a una app a la vez: desconéctalo de esa app.',
        ],
        [
          'TwistLab connects to the cube through the **browser’s Bluetooth** (Web Bluetooth), which not every browser has:',
          '- **Android, Windows, Mac and Linux**: with Chrome, Edge or Opera. On Linux, you may need to turn on Web Bluetooth first in chrome://flags.',
          '- **iPhone and iPad**: neither Safari nor Chrome can connect to a cube. Install **Bluefy**, a free browser with Bluetooth, and open TwistLab in it.',
          '- **Firefox**: it doesn’t work, because it doesn’t support Web Bluetooth.',
          'With some GAN, MoYu or QiYi cubes, TwistLab asks for their **MAC address** the first time. It’s a code that identifies each cube, in the form AA:BB:CC:DD:EE:FF. The app remembers it and won’t ask again. If you don’t know it, open "How do I find my cube’s MAC?" on the "Cube" screen.',
          'When you tap "Connect cube", the browser shows you a list of cubes. If yours doesn’t show up, turn it a little to wake it up. If it still doesn’t, it may be connected to another app, such as the brand’s own app. A cube can only connect to one app at a time: disconnect it from that app.',
        ],
        [
          'O TwistLab se conecta ao cubo pelo **Bluetooth do navegador** (Web Bluetooth), que nem todo navegador tem:',
          '- **Android, Windows, Mac e Linux**: com Chrome, Edge ou Opera. No Linux, talvez você precise ativar primeiro o Web Bluetooth em chrome://flags.',
          '- **iPhone e iPad**: nem o Safari nem o Chrome conseguem conectar um cubo. Instale o **Bluefy**, um navegador gratuito com Bluetooth, e abra o TwistLab nele.',
          '- **Firefox**: não serve, porque não tem Web Bluetooth.',
          'Com alguns cubos da GAN, MoYu ou QiYi, o TwistLab pede o **endereço MAC** deles na primeira vez. É um código que identifica cada cubo, no formato AA:BB:CC:DD:EE:FF. O app guarda esse código e não pede de novo. Se você não sabe qual é, abra "Como encontro o MAC do meu cubo?" na tela "Cubo".',
          'Ao tocar em "Conectar cubo", o navegador mostra uma lista de cubos. Se o seu não aparecer, gire-o um pouco para acordá-lo. Se ainda não aparecer, ele pode estar conectado a outro app, por exemplo, o app da própria marca. Um cubo só se conecta a um app de cada vez: desconecte-o desse app.',
        ],
      ),
      more: [cube],
    },
  ] as ArticleSection[],
};
