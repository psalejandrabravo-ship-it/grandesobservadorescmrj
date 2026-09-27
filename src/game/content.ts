export const INTRO = [
  {
    text: "Cuando estamos con otras personas, podemos detenernos un momento.",
    image: "/assets/illustrations/intro-1.jpg",
    voice: "/assets/audio/voice/intro-1.mp3",
    alt: "Niñas y niños en una sala se detienen al notar algo que ocurre cerca.",
  },
  {
    text: "Miramos con atención su rostro, su cuerpo y lo que está ocurriendo a su alrededor.",
    image: "/assets/illustrations/intro-2.jpg",
    voice: "/assets/audio/voice/intro-2.mp3",
    alt: "Una interacción cotidiana donde se ven rostros, posturas, manos y el entorno.",
  },
  {
    text: "Así podemos observar señales que nos ayudan a imaginar cómo podrían sentirse.",
    image: "/assets/illustrations/intro-3.jpg",
    voice: "/assets/audio/voice/intro-3.mp3",
    alt: "Dos personas reaccionan de maneras distintas frente a una misma situación.",
  },
  {
    text: "Ahora uniremos las partes de distintas imágenes y observaremos las situaciones completas.",
    image: "/assets/illustrations/intro-4.jpg",
    voice: "/assets/audio/voice/intro-4.mp3",
    alt: "Una escena que anticipa reunir partes para observar una situación completa.",
  },
] as const;

export type Situation = {
  id: number;
  title: string;
  voiceText: string;
  voice: string;
  image: string;
  alt: string;
  main: string;
  extra: string[];
  observe: string[];
};

const before =
  "Invita al grupo a mirar las partes sin intentar decidir todavía cómo se siente cada persona.";
const during = "Puedes preguntar qué elementos reconocen y qué podría estar ocurriendo.";
const after =
  "Observen el rostro, el cuerpo, las manos, la distancia entre las personas y lo que ocurre alrededor.";
const close =
  "Podemos mirar estas señales e imaginar distintas posibilidades. Cada persona puede sentirse de una manera diferente. Para saber cómo se siente una persona, podemos preguntarle con respeto.";

export const GUIDE_COMMON = { before, during, after, close };

export const SITUATIONS: Situation[] = [
  {
    id: 1,
    title: "La construcción se cayó",
    voiceText: "Observemos su rostro, su cuerpo y lo que ocurrió con la construcción.",
    voice: "/assets/audio/voice/sit-01.mp3",
    image: "/assets/illustrations/s1.jpg",
    alt: "Emilia mira una construcción de bloques que se cayó.",
    main: "¿Qué observamos en esta situación?",
    extra: [
      "¿Qué ocurrió con la construcción?",
      "¿Qué vemos en su rostro?",
      "¿Qué observamos en sus manos y hombros?",
      "¿Cómo podría sentirse?",
      "¿Podría sentir más de una cosa?",
    ],
    observe: ["Dirección de la mirada", "Hombros y manos", "Cercanía a los bloques", "Torre caída", "Reacción de la otra persona"],
  },
  {
    id: 2,
    title: "Una invitación para jugar",
    voiceText: "Miremos cómo están ubicados y qué hacen con sus manos y su cuerpo.",
    voice: "/assets/audio/voice/sit-02.mp3",
    image: "/assets/illustrations/s2.jpg",
    alt: "Dos niños hacen espacio e invitan a otra persona a acercarse a su juego.",
    main: "¿Qué observamos en esta situación?",
    extra: [
      "¿Qué parecen estar haciendo?",
      "¿Cómo sabemos que hay una invitación?",
      "¿Qué observa la persona que está más lejos?",
      "¿Cómo podría sentirse al acercarse?",
      "¿Qué podría responder?",
    ],
    observe: ["Mano o brazo que invita", "Espacio abierto", "Orientación corporal", "Miradas", "Distancia"],
  },
  {
    id: 3,
    title: "El ruido inesperado",
    voiceText: "Observemos cómo reaccionaron las personas ante el ruido.",
    voice: "/assets/audio/voice/sit-03.mp3",
    image: "/assets/illustrations/s3.jpg",
    alt: "Dos niños interrumpen una actividad y miran hacia el lugar de donde vino un ruido inesperado.",
    main: "¿Qué observamos cuando se produjo el ruido?",
    extra: [
      "¿Qué pudo haber ocurrido?",
      "¿Hacia dónde están mirando?",
      "¿Reaccionaron de la misma manera?",
      "¿Cómo podría sentirse cada persona?",
      "¿Qué podrían hacer después?",
    ],
    observe: ["Cambio de postura", "Dirección de la mirada", "Manos detenidas", "Materiales interrumpidos", "Respuestas distintas"],
  },
  {
    id: 4,
    title: "El juguete que está siendo usado",
    voiceText: "Miremos el juguete y cómo se acercan las dos personas.",
    voice: "/assets/audio/voice/sit-04.mp3",
    image: "/assets/illustrations/s4.jpg",
    alt: "Isidora se acerca impaciente al juguete que Joaquín todavía está usando.",
    main: "¿Qué está ocurriendo con el juguete?",
    extra: [
      "¿Quién lo está usando?",
      "¿Qué observa la persona que se acercó?",
      "¿Qué podrían decirse?",
      "¿Cómo podría sentirse cada una?",
      "¿Qué podrían hacer?",
    ],
    observe: ["Quién sostiene el objeto", "Atención compartida", "Manos", "Distancia", "Postura de acercamiento"],
  },
  {
    id: 5,
    title: "Mirando el juego desde lejos",
    voiceText: "Observemos al grupo y a la persona que mira desde más lejos.",
    voice: "/assets/audio/voice/sit-05.mp3",
    image: "/assets/illustrations/s5.jpg",
    alt: "Un grupo juega en el patio mientras otra persona observa desde cierta distancia.",
    main: "¿Qué observamos en el grupo y en la persona que está más lejos?",
    extra: [
      "¿Qué está haciendo el grupo?",
      "¿Qué hace la persona que observa?",
      "¿Por qué podría estar mirando?",
      "¿Cómo podría sentirse?",
      "¿Qué podríamos preguntarle?",
    ],
    observe: ["Distancia", "Dirección de la mirada", "Postura de quien observa", "Actividad del grupo", "Espacio para acercarse"],
  },
  {
    id: 6,
    title: "Un dibujo de regalo",
    voiceText: "Miremos cómo entrega el dibujo y cómo lo recibe la otra persona.",
    voice: "/assets/audio/voice/sit-06.mp3",
    image: "/assets/illustrations/s6.jpg",
    alt: "Una niña entrega un dibujo hecho a mano a otra persona, que lo recibe y lo observa.",
    main: "¿Qué observamos cuando entrega el dibujo?",
    extra: [
      "¿Qué está entregando?",
      "¿Qué observamos en quien lo recibe?",
      "¿Cómo podría sentirse quien hizo el dibujo?",
      "¿Cómo podría sentirse quien lo recibe?",
      "¿Podrían sentir cosas diferentes?",
    ],
    observe: ["Manos que ofrecen y reciben", "Miradas", "Cercanía", "Postura", "Cuidado en la entrega"],
  },
  {
    id: 7,
    title: "Una caída en el patio",
    voiceText: "Observemos qué ocurrió y cómo se acerca la otra persona.",
    voice: "/assets/audio/voice/sit-07.mp3",
    image: "/assets/illustrations/s7.jpg",
    alt: "Un niño está sentado en el patio después de una caída leve mientras otra persona se acerca.",
    main: "¿Qué observamos en esta situación?",
    extra: [
      "¿Qué pudo haber ocurrido?",
      "¿Qué hace la persona que se acerca?",
      "¿Qué podríamos preguntarle a quien cayó?",
      "¿Cómo podría sentirse?",
      "¿Qué podría necesitar?",
    ],
    observe: ["Posición en el suelo", "Manos y rodillas", "Cercanía de quien se aproxima", "Orientación", "Elementos del patio"],
  },
  {
    id: 8,
    title: "No encuentra su objeto especial",
    voiceText: "Miremos dónde busca y qué hacen las personas en la escena.",
    voice: "/assets/audio/voice/sit-08.mp3",
    image: "/assets/illustrations/s8.jpg",
    alt: "Sofía busca preocupada su objeto especial dentro de la mochila.",
    main: "¿Qué parece estar ocurriendo?",
    extra: [
      "¿Qué parece estar buscando?",
      "¿Qué nos ayuda a comprenderlo?",
      "¿Qué hace la otra persona?",
      "¿Cómo podría sentirse mientras busca?",
      "¿Qué podrían hacer juntos?",
    ],
    observe: ["Acción de buscar", "Postura inclinada", "Manos", "Espacios revisados", "Participación de la otra persona"],
  },
  {
    id: 9,
    title: "Una tarea bien realizada",
    voiceText: "Observemos el trabajo terminado y la forma en que lo están mirando.",
    voice: "/assets/audio/voice/sit-09.mp3",
    image: "/assets/illustrations/s9.jpg",
    alt: "Una niña observa un trabajo que acaba de terminar mientras otra persona mira el resultado junto a ella.",
    main: "¿Qué observamos cuando mira su trabajo?",
    extra: [
      "¿Qué acaba de hacer?",
      "¿Qué observamos en su postura?",
      "¿Cómo podría sentirse al mirar su trabajo?",
      "¿Podría sentir más de una cosa?",
      "¿Qué podría decirle la otra persona?",
    ],
    observe: ["Postura frente al trabajo", "Cuidado del objeto", "Manos", "Mirada", "Atención de quien acompaña"],
  },
  {
    id: 10,
    title: "Antes de una presentación escolar",
    voiceText: "Observemos cómo se prepara cada persona antes de la presentación.",
    voice: "/assets/audio/voice/sit-10.mp3",
    image: "/assets/illustrations/s10.jpg",
    alt: "Tres niños se preparan de maneras diferentes antes de una presentación escolar.",
    main: "¿Qué observamos mientras se preparan?",
    extra: [
      "¿Qué parece que ocurrirá después?",
      "¿Se están preparando de la misma manera?",
      "¿Cómo podría sentirse cada persona?",
      "¿Podrían sentir más de una cosa?",
      "¿Qué podría ayudarlos?",
    ],
    observe: ["Posturas diferentes", "Manos", "Dirección de la mirada", "Proximidad", "Objetos de la actividad"],
  },
];

export const AFTER_ASK = [
  "¿Cómo podría sentirse?",
  "¿Cómo podría sentirse al acercarse?",
  "¿Cómo podría sentirse cada persona?",
  "¿Cómo podría sentirse cada una?",
  "¿Cómo podría sentirse?",
  "¿Podrían sentir cosas diferentes?",
  "¿Cómo podría sentirse?",
  "¿Cómo podría sentirse mientras busca?",
  "¿Cómo podría sentirse al mirar su trabajo?",
  "¿Podrían sentir más de una cosa?",
];

export const VIDEO_SRC = "/assets/video/apertura.mp4";
