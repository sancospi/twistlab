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

const cube = { href: routePath({ mod: 'cube' }), label: tr('Conectar tu cubo en TwistLab', 'Connect your cube in TwistLab', 'Conectar seu cubo no TwistLab') };
const timer = { href: routePath({ mod: 'solve' }), label: tr('El Resolver: cronómetro y análisis de cada resolución', 'Solve: the timer and the analysis of every solve', 'O Resolver: cronômetro e análise de cada resolução') };

export const smartCubes = {
  name: tr('Cubo inteligente: cuál comprar para entrenar', 'Smart cube: which one to buy for training', 'Cubo inteligente: qual comprar para treinar'),
  summary: tr(
    'Qué marcas de cubo inteligente funcionan con TwistLab, qué cambia entre ellas (giroscopio, si informan su estado) y qué necesitas en tu móvil o tu ordenador.',
    'Which smart cube brands work with TwistLab, what changes between them (gyroscope, whether they report their state) and what you need on your phone or computer.',
    'Quais marcas de cubo inteligente funcionam com o TwistLab, o que muda entre elas (giroscópio, se informam o seu estado) e do que você precisa no celular ou no computador.',
  ),
  nav: tr('Partes de la guía', 'Guide sections', 'Partes do guia'),
  sections: [
    {
      id: 'que-es',
      title: tr('Qué es un cubo inteligente', 'What a smart cube is', 'O que é um cubo inteligente'),
      body: doc(
        [
          'Un cubo de velocidad con sensores que envía **cada giro por Bluetooth**. Se gira como cualquier otro y se puede usar sin conectar.',
          'Conectado a TwistLab:',
          '- El cronómetro arranca con tu primer giro y para solo al resolverlo.',
          '- Cada resolución se parte en **cruz, pares del F2L, OLL y PLL**, con su tiempo, sus giros y sus pausas, y te dice **qué mejorar**.',
          '- Te guía giro a giro al mezclar, y en la Academia sigue tus algoritmos y te corrige al practicar.',
          '- «En tu cubo» te dice el caso que tienes delante y cómo resolverlo.',
        ],
        [
          'A speed cube with sensors that sends **every turn over Bluetooth**. It turns like any other and works without connecting it.',
          'Connected to TwistLab:',
          '- The timer starts with your first turn and stops by itself when the cube is solved.',
          '- Every solve is split into **cross, F2L pairs, OLL and PLL**, with its time, its turns and its pauses, and it tells you **what to improve**.',
          '- It guides you turn by turn when scrambling, and in the Academy it follows your algorithms and corrects you while you practice.',
          '- "On your cube" tells you the case in front of you and how to solve it.',
        ],
        [
          'Um cubo de velocidade com sensores que envia **cada giro por Bluetooth**. Gira como qualquer outro e dá para usar sem conectar.',
          'Conectado ao TwistLab:',
          '- O cronômetro começa com o seu primeiro giro e para sozinho quando o cubo é resolvido.',
          '- Cada resolução é dividida em **cruz, pares do F2L, OLL e PLL**, com o seu tempo, os seus giros e as suas pausas, e ele diz **o que melhorar**.',
          '- Ele guia você giro a giro ao embaralhar e, na Academia, acompanha os seus algoritmos e corrige você enquanto pratica.',
          '- "No seu cubo" mostra o caso que você tem na frente e como resolvê-lo.',
        ],
      ),
      more: [timer],
    },
    {
      id: 'marcas',
      title: tr('Marcas que funcionan con TwistLab', 'Brands that work with TwistLab', 'Marcas que funcionam com o TwistLab'),
      body: doc(
        [
          'TwistLab conecta cubos inteligentes de estas marcas:',
          '- **GAN**: informan su estado; giroscopio según el modelo.',
          '- **MoYu** (WeiLong AI): informan su estado; giroscopio según el modelo.',
          '- **QiYi** (incluido el X-Man Tornado V4 i): informan su estado; giroscopio según el modelo.',
          '- **GiiKER**: su estado se lee al conectar; sin giroscopio.',
          '- **GoCube** y **Rubik’s Connected**: con giroscopio; no informan su estado.',
          'Cualquiera sirve para cronometrar, analizar tus resoluciones y practicar algoritmos. Lo que cambia es lo de la siguiente sección.',
        ],
        [
          'TwistLab connects smart cubes of these brands:',
          '- **GAN**: they report their state; a gyroscope depending on the model.',
          '- **MoYu** (WeiLong AI): they report their state; a gyroscope depending on the model.',
          '- **QiYi** (including the X-Man Tornado V4 i): they report their state; a gyroscope depending on the model.',
          '- **GiiKER**: their state is read when they connect; no gyroscope.',
          '- **GoCube** and **Rubik’s Connected**: with a gyroscope; they don’t report their state.',
          'Any of them works to time, analyse your solves and practise algorithms. What changes is in the next section.',
        ],
        [
          'O TwistLab conecta cubos inteligentes destas marcas:',
          '- **GAN**: informam o seu estado; giroscópio conforme o modelo.',
          '- **MoYu** (WeiLong AI): informam o seu estado; giroscópio conforme o modelo.',
          '- **QiYi** (incluindo o X-Man Tornado V4 i): informam o seu estado; giroscópio conforme o modelo.',
          '- **GiiKER**: o estado é lido ao conectar; sem giroscópio.',
          '- **GoCube** e **Rubik’s Connected**: com giroscópio; não informam o seu estado.',
          'Qualquer um serve para cronometrar, analisar as suas resoluções e praticar algoritmos. O que muda está na próxima seção.',
        ],
      ),
    },
    {
      id: 'que-mirar',
      title: tr('Qué mirar al elegir', 'What to look at when choosing', 'O que olhar na hora de escolher'),
      body: doc(
        [
          '## Que informe su estado',
          'Un cubo que **informa su estado** (GAN, MoYu, QiYi) le dice a la app cómo está mientras giras: si se pierde un giro, se corrige solo. GiiKER lo informa al conectar. GoCube y Rubik’s Connected no lo informan: empiezan dándose por resueltos. Si el cubo en pantalla no coincide con el tuyo, lo resuelves a mano y lo marcas como resuelto (con un botón o dando dos vueltas seguidas a la cara amarilla).',
          '## El giroscopio',
          'Con **giroscopio**, el cubo en pantalla sigue cómo lo sostienes en la mano. Sin él, lo giras con las flechas. No hace falta para cronometrar ni para el análisis.',
          '## Lo demás, como en cualquier cubo de velocidad',
          'El tacto, los imanes, el peso y el precio se eligen como en un cubo normal: el que te guste girar. Si ya tienes uno de las marcas de arriba, conéctalo antes de comprar otro.',
        ],
        [
          '## That it reports its state',
          'A cube that **reports its state** (GAN, MoYu, QiYi) tells the app how it is while you turn: if a turn gets lost, it corrects itself. GiiKER reports it when it connects. GoCube and Rubik’s Connected don’t report it: they start by taking themselves as solved. If the cube on screen doesn’t match yours, you solve it by hand and mark it as solved (with a button, or with two full turns of the yellow face in a row).',
          '## The gyroscope',
          'With a **gyroscope**, the cube on screen follows how you hold it in your hand. Without one, you turn it with the arrows. It isn’t needed for timing or for the analysis.',
          '## Everything else, as with any speed cube',
          'Feel, magnets, weight and price are chosen as with a regular cube: the one you like turning. If you already have one of the brands above, connect it before buying another.',
        ],
        [
          '## Que informe o seu estado',
          'Um cubo que **informa o seu estado** (GAN, MoYu, QiYi) diz ao app como está enquanto você gira: se um giro se perde, ele se corrige sozinho. O GiiKER informa ao conectar. GoCube e Rubik’s Connected não informam: começam se considerando resolvidos. Se o cubo na tela não bate com o seu, você o resolve à mão e o marca como resolvido (com um botão ou com duas voltas seguidas na face amarela).',
          '## O giroscópio',
          'Com **giroscópio**, o cubo na tela acompanha como você o segura na mão. Sem ele, você o gira com as setas. Não é necessário para cronometrar nem para a análise.',
          '## O resto, como em qualquer cubo de velocidade',
          'Toque, ímãs, peso e preço se escolhem como num cubo normal: o que você gostar de girar. Se você já tem um das marcas acima, conecte-o antes de comprar outro.',
        ],
      ),
    },
    {
      id: 'dispositivos',
      title: tr('En qué móvil u ordenador', 'On which phone or computer', 'Em qual celular ou computador'),
      body: doc(
        [
          'La conexión usa **Bluetooth desde el navegador** (Web Bluetooth):',
          '- **Android, Windows y Mac**: con Chrome, Edge u Opera. En Linux, Web Bluetooth puede necesitar activarse antes en chrome://flags.',
          '- **iPhone y iPad**: Safari no puede conectar un cubo. Instala **Bluefy**, un navegador gratuito con Bluetooth, y abre TwistLab en él.',
          '- Firefox no tiene Web Bluetooth.',
          'La primera vez, algunos cubos (de GAN, MoYu o QiYi) pueden pedir su **dirección MAC**: TwistLab la recuerda para las siguientes.',
          'Un cubo se conecta a una sola app a la vez: si no aparece en la lista, desconéctalo de la otra app y gíralo un poco para despertarlo.',
        ],
        [
          'The connection uses **Bluetooth from the browser** (Web Bluetooth):',
          '- **Android, Windows and Mac**: with Chrome, Edge or Opera. On Linux, Web Bluetooth may need to be enabled first in chrome://flags.',
          '- **iPhone and iPad**: Safari can’t connect a cube. Install **Bluefy**, a free browser with Bluetooth, and open TwistLab in it.',
          '- Firefox has no Web Bluetooth.',
          'The first time, some cubes (from GAN, MoYu or QiYi) may ask for their **MAC address**: TwistLab remembers it for the next times.',
          'A cube connects to one app at a time: if it doesn’t show up in the list, disconnect it from the other app and turn it a little to wake it up.',
        ],
        [
          'A conexão usa **Bluetooth pelo navegador** (Web Bluetooth):',
          '- **Android, Windows e Mac**: com Chrome, Edge ou Opera. No Linux, o Web Bluetooth pode precisar ser ativado antes em chrome://flags.',
          '- **iPhone e iPad**: o Safari não consegue conectar um cubo. Instale o **Bluefy**, um navegador gratuito com Bluetooth, e abra o TwistLab nele.',
          '- O Firefox não tem Web Bluetooth.',
          'Na primeira vez, alguns cubos (da GAN, MoYu ou QiYi) podem pedir o seu **endereço MAC**: o TwistLab o lembra para as próximas vezes.',
          'Um cubo se conecta a um app de cada vez: se ele não aparecer na lista, desconecte-o do outro app e gire-o um pouco para acordá-lo.',
        ],
      ),
      more: [cube],
    },
  ] as ArticleSection[],
};
