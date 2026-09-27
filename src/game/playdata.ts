export type Mood =
  | "contenta"
  | "contento"
  | "contentos"
  | "frustrada"
  | "tranquila"
  | "tranquilo"
  | "tranquilos"
  | "asustada"
  | "asustado"
  | "asustados"
  | "enojada"
  | "enojados"
  | "sorprendidos"
  | "impacientes"
  | "triste"
  | "tristes"
  | "orgullosa"
  | "orgulloso"
  | "orgullosos"
  | "preocupada"
  | "dolorido"
  | "nerviosos";

export type FaceChoice = { label: string; mood: Mood; alt: string; ok: boolean };

export type PlayBeat = {
  looks: [string, string];
  story: string;
  ask: string;
  why: string;
  hint: string;
  choices: FaceChoice[];
};

const face = (_scene: number, mood: Mood, label: string, alt: string, ok: boolean): FaceChoice => ({
  label,
  mood,
  alt,
  ok,
});

export const PLAY: PlayBeat[] = [
  {
    looks: ["¿Se ven ojos tristes o alegres?", "¿Hay algo que pueda haber pasado con la construcción?"],
    story: "Emilia ve que su construcción se cayó.",
    ask: "¿Cómo creen que se siente Emilia?",
    why: "Podemos imaginar que está frustrada: mira los bloques, sus hombros están un poco caídos y su rostro no está alegre.",
    hint: "Miremos otra vez la imagen. Sus gestos pueden indicar que está frustrada.",
    choices: [
      face(1, "contenta", "Contenta", "Rostro de Emilia con una expresión contenta.", false),
      face(1, "frustrada", "Frustrada", "Rostro de Emilia con una expresión frustrada.", true),
      face(1, "tranquila", "Tranquila", "Rostro de Emilia con una expresión tranquila.", false),
    ],
  },
  {
    looks: ["¿Alguien está invitando a jugar?", "¿Qué hacen con las manos y el cuerpo?"],
    story: "Martín invita a Amalia a jugar.",
    ask: "¿Cómo creen que se siente Amalia?",
    why: "Martín abre un lugar y la invita. Amalia mira el juego con interés, así que podría sentirse contenta.",
    hint: "Miremos otra vez la imagen. La invitación y su mirada pueden indicar que está contenta.",
    choices: [
      face(2, "asustada", "Asustada", "Rostro de Amalia con una expresión asustada.", false),
      face(2, "enojada", "Enojada", "Rostro de Amalia con una expresión enojada.", false),
      face(2, "contenta", "Contenta", "Rostro de Amalia con una expresión contenta.", true),
    ],
  },
  {
    looks: ["¿Hacia dónde están mirando?", "¿El cuerpo se quedó quieto o siguió jugando?"],
    story: "Mateo y Rafaela escuchan un ruido inesperado.",
    ask: "¿Cómo creen que se sienten Mateo y Rafaela?",
    why: "Se detuvieron, abrieron un poco los ojos y miraron hacia el ruido. Podrían estar sorprendidos.",
    hint: "Miremos otra vez la imagen. Sus gestos pueden indicar que están sorprendidos.",
    choices: [
      face(3, "sorprendidos", "Sorprendidos", "Rostros de Mateo y Rafaela con expresión de sorpresa.", true),
      face(3, "tranquilos", "Tranquilos", "Rostros tranquilos de Mateo y Rafaela.", false),
      face(3, "enojados", "Enojados", "Rostros enojados de Mateo y Rafaela.", false),
    ],
  },
  {
    looks: ["¿Quién está usando el juguete?", "¿Alguien más quiere usarlo?"],
    story: "Isidora quiere usar el juguete de Joaquín.",
    ask: "¿Cómo creen que se sienten Isidora y Joaquín?",
    why: "Isidora se acerca porque quiere usarlo y Joaquín todavía está jugando. Ella podría estar impaciente y él, molesto.",
    hint: "Miremos otra vez la imagen. Sus gestos pueden indicar impaciencia y molestia.",
    choices: [
      face(4, "contentos", "Contentos", "Rostros contentos de Isidora y Joaquín.", false),
      face(4, "impacientes", "Impaciente y molesto", "Rostros de Isidora impaciente y Joaquín molesto.", true),
      face(4, "asustados", "Asustados", "Rostros asustados de Isidora y Joaquín.", false),
    ],
  },
  {
    looks: ["¿Está cerca o lejos del juego?", "¿Cómo tiene los brazos?"],
    story: "Valentina mira el juego desde lejos.",
    ask: "¿Cómo creen que se siente Valentina?",
    why: "Está apartada, mira a los demás y su cuerpo se ve un poco encogido. Podría sentirse triste.",
    hint: "Miremos otra vez la imagen. La distancia y su postura pueden indicar que está triste.",
    choices: [
      face(5, "tranquila", "Tranquila", "Rostro tranquilo de Valentina.", false),
      face(5, "enojada", "Enojada", "Rostro enojado de Valentina.", false),
      face(5, "triste", "Triste", "Rostro triste de Valentina.", true),
    ],
  },
  {
    looks: ["¿Qué se están pasando?", "¿Cómo están sus manos?"],
    story: "Benjamín entrega un dibujo a Clara.",
    ask: "¿Cómo creen que se sienten Benjamín y Clara?",
    why: "Benjamín entrega algo que hizo y Clara lo recibe mirándolo. Él podría estar orgulloso y ella, contenta.",
    hint: "Miremos otra vez la imagen. El dibujo y sus gestos pueden indicar orgullo y alegría.",
    choices: [
      face(6, "orgullosos", "Orgulloso y contenta", "Benjamín se ve orgulloso y Clara contenta.", true),
      face(6, "enojados", "Enojados", "Rostros enojados de Benjamín y Clara.", false),
      face(6, "asustados", "Asustados", "Rostros asustados de Benjamín y Clara.", false),
    ],
  },
  {
    looks: ["¿Qué pasó en el patio?", "¿Qué hace con su rodilla?"],
    story: "Diego se cayó en el patio.",
    ask: "¿Cómo creen que se siente Diego?",
    why: "Está en el suelo y sostiene su rodilla. Su rostro muestra malestar, así que podría sentirse dolorido.",
    hint: "Miremos otra vez la imagen. Su rodilla y su rostro pueden indicar que está dolorido.",
    choices: [
      face(7, "contento", "Contento", "Rostro contento de Diego.", false),
      face(7, "dolorido", "Dolorido", "Rostro de Diego con malestar.", true),
      face(7, "tranquilo", "Tranquilo", "Rostro tranquilo de Diego.", false),
    ],
  },
  {
    looks: ["¿Qué está buscando?", "¿Se ve tranquila o preocupada?"],
    story: "Sofía no encuentra su objeto especial.",
    ask: "¿Cómo creen que se siente Sofía?",
    why: "Busca entre sus cosas y el objeto no aparece. Su mirada puede indicar que está preocupada.",
    hint: "Miremos otra vez la imagen. Sus manos y su mirada pueden indicar que está preocupada.",
    choices: [
      face(8, "preocupada", "Preocupada", "Rostro preocupado de Sofía.", true),
      face(8, "orgullosa", "Orgullosa", "Rostro orgulloso de Sofía.", false),
      face(8, "tranquila", "Tranquila", "Rostro tranquilo de Sofía.", false),
    ],
  },
  {
    looks: ["¿Terminó lo que estaba haciendo?", "¿Cómo mira su trabajo?"],
    story: "Nicolás mira su trabajo terminado.",
    ask: "¿Cómo creen que se siente Nicolás?",
    why: "El trabajo está listo y él lo mira con una sonrisa suave. Podría sentirse orgulloso.",
    hint: "Miremos otra vez la imagen. Su sonrisa y su postura pueden indicar que está orgulloso.",
    choices: [
      face(9, "triste", "Triste", "Rostro triste de Nicolás.", false),
      face(9, "asustado", "Asustado", "Rostro asustado de Nicolás.", false),
      face(9, "orgulloso", "Orgulloso", "Rostro orgulloso de Nicolás.", true),
    ],
  },
  {
    looks: ["¿Están esperando algo juntos?", "¿Todos tienen el mismo gesto?"],
    story: "Antonia y sus compañeros esperan antes de una presentación.",
    ask: "¿Cómo creen que se sienten Antonia y sus compañeros?",
    why: "Algunos tienen el cuerpo tenso y otros sonríen. Podrían estar nerviosos y también entusiasmados.",
    hint: "Miremos otra vez la imagen. Las manos juntas y las sonrisas pueden indicar nervios y entusiasmo.",
    choices: [
      face(10, "enojados", "Enojados", "Rostros enojados antes de la presentación.", false),
      face(10, "nerviosos", "Nerviosos", "Rostros nerviosos y entusiasmados.", true),
      face(10, "tristes", "Tristes", "Rostros tristes antes de la presentación.", false),
    ],
  },
];
