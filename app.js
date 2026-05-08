const STORAGE_KEY = "kinepro.clinic.v1";
const SESSION_KEY = "kinepro.session.v1";
const ADMIN_EMAIL = "magurnojuan@gmail.com";
const ADMIN_PASSWORD = "Novi2800";
const channel = "BroadcastChannel" in window ? new BroadcastChannel("kinepro-sync") : null;
const firebaseConfig = {
  apiKey: "AIzaSyDBFPOHtc3LtwBcaifGc2TWaMzWReWmq_4",
  authDomain: "kinepro-8a56b.firebaseapp.com",
  projectId: "kinepro-8a56b",
  storageBucket: "kinepro-8a56b.firebasestorage.app",
  messagingSenderId: "126558895981",
  appId: "1:126558895981:web:136e621f3f36fce261e464"
};
let cloudStateRef = null;
let firebaseDb = null;
let firebaseAuth = null;
let firebaseSetDoc = null;
let firebaseDeleteDoc = null;
let firebaseGetDoc = null;
let firebaseGetDocs = null;
let firebaseOnSnapshot = null;
let firebaseServerTimestamp = null;
let firebaseCollection = null;
let firebaseDoc = null;
let firebaseSignInWithEmailAndPassword = null;

const state = loadState();
let currentSession = loadSession();
let exerciseDraft = [];
let syncTimer;
let selectedPatientId = null;
let editingRoutineId = null;
let editingExerciseIndex = null;
let routineSpeechRecognition = null;
let routineSpeechIsListening = false;
let applyingRemoteState = false;
let cloudEnabled = false;

const views = {
  dashboard: "Bienvenido, Juan-Manuel",
  patients: "Pacientes",
  routines: "Rutinas",
  sessions: "Ejecucion",
  history: "Estadisticas"
};

const viewSubtitles = {
  dashboard: "Tene el control total de tu consultorio.",
  routines: "Crea, gestiona y asigna programas terapeuticos.",
  sessions: "Inicia, controla y registra tus sesiones de entrenamiento.",
  patients: "Gestiona fichas, accesos y seguimiento clinico.",
  history: "Analiza el rendimiento y evolucion de tus pacientes."
};

const ENTITY_COLLECTIONS = {
  patients: { collection: "patients", key: "patients" },
  routines: { collection: "routines", key: "routines" },
  activeSessions: { collection: "sessions_active", key: "activeSessions" },
  history: { collection: "sessions_history", key: "history" },
  athletes: { collection: "athletes", key: "athletes" },
  exerciseLibrary: { collection: "exercise_library", key: "exerciseLibrary" }
};

const ABANDONED_SESSION_MS = 4 * 60 * 60 * 1000;
const EXERCISE_LIBRARY = [
    {
        "name":  "Elongacion fascia sentado",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Elongacion psoas dinamica",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Estocada con rotacion contraria con pesa rusa",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Postura caballero manos juntas movilidad escapular",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Spiderman tocando tobillos rotando",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Tocar rodillas en rotacion",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Espinales + movilidad escapular alternada",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Retraccion escapular con banda en codos",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Rotacion externa de hombro con banda",
        "category":  "MOVILIDAD Y ACTIVACION ESCAPULAR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Superman",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha alta con transferencia de mancuerna",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha con apertura lateral y diagonal con banda",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha baja con rotacion escapular con mancuerna",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha alta a plancha baja con rodillas al pecho",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Oblicuos con pesa rusa",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Bicho muerto y sus variantes",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Rotaciones con banda arrodillado Pallof press",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha lateral con mancuerna y flexion de rodilla",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Abductores en plancha lateral con disco",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Vitalizacion en caballero con kettlebell invertida",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha y pies adentro afuera arriba y abajo",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Plancha y rodillas al medio y afuera",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Aductores banco plancha lateral Copenhague",
        "category":  "CORE / ESCAPULA / ESTABILIDAD",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Bisagra de cadera con estiramiento posterior",
        "category":  "MOVILIDAD CADENA POSTERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Elongacion fascia aguantando respiracion",
        "category":  "MOVILIDAD CADENA POSTERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Elongacion de columna en cruz",
        "category":  "MOVILIDAD CADENA POSTERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Saltos laterales alternados sobre cajon",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Peso muerto con barra",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Bulgaras con vuelos laterales",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Sentadilla tocando tobillos alternados",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Desplazamiento lateral con banda + sentadilla",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Sentadilla con pesa rusa y banda en los pies",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Sentadillas en TRX",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Subida al cajon con mancuernas + press hombro",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Subida al cajon con pesa rusa",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Sentadilla + saltos potencia",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Saltos a la barra a una pierna",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Sentadilla con barra",
        "category":  "FUERZA TREN INFERIOR / POTENCIA",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Dominadas",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Dominadas con peso",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Aperturas de pecho en banco o pelota",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Flexiones con remo",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Flexiones de brazos con flexion de rodilla explosiva",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Remo con banda elastica",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Pecho / remo en TRX",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Press de hombro con banda en la panza",
        "category":  "FUERZA TREN SUPERIOR",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Estocada con press de hombro unilateral",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Peso muerto con arranque de potencia unilateral",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Peso muerto unipodal + press de hombros potente",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Peso muerto unipodal + biceps",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Peso muerto unipodal + remo",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Puente gluteo unilateral con press de pecho alternado",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Press en piso + puente gluteo press pecho explosivo",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Estocada + rotaciones con disco o pesa",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Arrodillado a parado con biceps + hombro",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "Burpees",
        "category":  "FUERZA INTEGRADA (PIERNAS + BRAZOS)",
        "source":  "EJERCICIOS PROKINESIO PDF"
    },
    {
        "name":  "VITALIZACION",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION A 1 PP INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION DOBLE INESTABLE",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION DEL CENTRO CRUZ ARRIBA",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION CRUZ DE ABAJO AL CENTRO",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION + ELAS LAT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION A 1 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION A 1 BB Y 1 PP INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION A 1 BB DOBLE INESTABLE",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VITALIZACION A 1 BB + ELAST LAT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION A 1 PP INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION DOBLE INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION A 1 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION A 1 BB Y 1 PP INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION A 1 BB Y DOBLE INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIA VITALIZACION + ELAS LATERAL",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON BARRA DE PNTA 2 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON BARRA DE PNTA 1 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON B.PNTA 2 BB + 1PP IN",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON B.PNTA 2 BB + 2 INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON B.PNTA 1 BB + 1PP IN",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON B.PNTA 1 BB + 2 INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP.DE FZA CON B.PNTA 2 BB + ELAS ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP. DE FZA CON B. PNTA 1 BB + EL ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP. DE FZA EN SPLIT CON B. PNTA A 2 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP. DE FZA EN SPLIT CON B. PNTA A 1 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 1 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 1 BB Y 1 PP INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 1 BB DOBLE INESTABLE",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 2 BB CON MANC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 2 BB CON 1 PP INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 2 BB CON DOBLE INES",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA CON BARRA",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP. DE FZA CON B. Y DISCOS COLGANDO",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 1 BB + ELAS LAT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 1 BB + ELAS FRONT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 2 BB + ELAS LAT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 2 BB + ELAS FRONT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP. DE FZA A 1 BB 1PP INES + ELAS FRONT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMP. DE FZA A 2 BB 1PP INES + ELAS FRONT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 1 BB + ELAS ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA A 2 BB + ELAS ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA EN SPLIT A 1 BB CON MANC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA EN SPLIT A 2 BB CON MANC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA EN SENT BULG A 1 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EMPUJE DE FZA EN SENT BULG A 2 BB",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 1 BB CON MANC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 2 BB CON MANC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO CON BARRA",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMP. CON B. Y DISC COLGANDO",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 1 BB + ELAS LAT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 1 BB + ELAS FRONT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 2 BB + ELAS LAT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 2 BB + ELAS FRONT",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 1 BB + ELAS ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO A 2 BB + ELAS ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA CON IMPULSO CON B. + ELAS ADUC",
        "category":  "ACTIVADORES NO OLIMPICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 1 BB CON BARRA DE PNTA",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 2 BB CON BARRA DE PNTA",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 1BB CON MANC",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 2BB CON MANC",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO CON BARRA POR DETRÁS",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 1 PP Y 1 BB HL.",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 1 PP Y 1 BB CL.",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO A 1 PP Y 2 BB MANC",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIEMPO CON BARRA POR DELANTE",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2 TIEMPO B. PNTA (CON TIJERA)",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2 TIEMPO X DETRÁS (CON TIJERA)",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2 TIEMPO X DELANTE (CON TIJERA)",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE DE FZA A 1 BB",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE DE FZA A 1 BB Y 1 PP INES",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE DE POT A 1 BB",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE FZA DE INGLE",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE FZA DE MEDIO MUSLO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE FZA COLGADO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE POTENCIA DE INGLE",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE POTENCIA DE MEDIO MUSLO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE POTENCIA COLGADO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE POT. DE SOPORTE MEDIO MUSLO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE POTENCIA DE SOPORTE COLGADO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR DE POTENCIA DE SOPORTE B.R.",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR FRANCES",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARR ALTERNO 1 PP/1 BB",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE ALTO DE VELOCIDAD",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "METIDAS DE ARRANQUE CON INSTR. DE GUE",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "METIDAS DE ARRANQUE",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "METIDAS DE ARRANQUE A 2 O 3 POSICIONES",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT A 1 PP CON BARRA",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT A 1 PP + ELAS LAT. EN ROD.",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT A 1 PP + ELAS FRONT. EN ROD.",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE FZA DE MEDIO MUSLO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE FZA DE COLGADO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POTENCIA DE MEDIO MUSLO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POTENCIA COLGADO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT. DE SOPORTE MEDIO MUSLO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT. DE SOPORTE COLGDADO",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT. DE SOPORTE B.R.",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT. COLGADO BAJO RODILLA",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT DE 1/2 MUSLO A LA FRANCESA",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT COLG A LA FRANCESA",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ENVION A UN PIE CON MANC",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA DE ARRANQUE",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA DE ARRANQUE CON MANC",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA DE ARRANQUE A 1 BB",
        "category":  "ACTIVADORES DLP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "1ER TIRON DE ARR",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "1ER TIRON DE ENV",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRON DE ARR",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRON DE ENV",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRANSICION DE TIRON ARRANQUE",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRANSICION DE TIRON CARGADA",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIRON DE ARR",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "2DO TIRON DE ENV",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE DE POT",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE CLASICO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE COLGADO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARGADAS DE POT",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARGADAS",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARGADA DE POT + FZA CON IMPULSO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARGADA DE POT + 2DO TIEMPO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARGADAS + FZA CON IMPULSO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT COLGADO + FZA CON IMP.",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARG DE POT COLGADO + 2DO TIEMPO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ENVION DE POT",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ENVION CLASICO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO CHINO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE DE INGLE",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CARGADA DE MEDIO MUSLO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ENVION DE MEDIO MUSLO",
        "category":  "PESAS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS CON MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS A 1 MANC CL.",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS CON BARRA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULG. CON DISC COLGANDO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS EN TRX Y MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS CON PP INES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS DE ARR CON MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS DE ARR PALITO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULG. DE ARR CON BARRA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULG. DE ARR CON ELAST",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS BULGARAS COPA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SUBIDAS AL BANCO CON MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SUBIDAS AL BANCO CON BARRA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SUBIDAS AL BANCO A 1 BB HL.",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SUBIDAS AL BANCO A 1 BB CL.",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SUBIDAS AL BANCO + ELAS FROT",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SUBIDAS AL BANCO + ELAS LAT",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA A 1 PP CON APOYO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA A 1 PP SIN APOYO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA A 1 PP SIN APOYO + ELAS",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS CON MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS CON MANC 1 BB CL.",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS CON BARRA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS CON DISC COLGANDO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS HIPER CON MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS HIPER CON BARRA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SPLITS COPA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ESTOCADAS HACIA ATRÁS CON MANC",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ESTOCADAS HACIA ATRÁS COPA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE SUMO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE SUMO HIPER",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE SUMO DESDE PISO CON BARRA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE SUMO A 1 PP INES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE SUMO DOBLE INES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE SUMO CON BARRA DE PNTA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE ROMANO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE ROMANO HIPER",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "1/4 DE DESPEGUE ROMANO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE ROMANO A 1 PP INES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE ROMANO DESDE PISO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GRUYA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GRUYA INESTABLE",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GRUYA + SALTO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GRUYA + ELAS LAT",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PISTOLAS A 2 PP",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PISTOLAS A 1 PP",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PISTOLAS A 1 PP + ELAS LAT",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PISTOLAS A 1 PP + ELAS FRONT",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS ADEL CON BB EXTENDIDOS",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS ATRÁS",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS ADELANTE",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENT. (DEL. O DET.) CON DISC COLGANDO",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA CON BARRA DE PNTA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLAS LATERALES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA COPA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA COPA A 1 PP INES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA COPA DOBLE INES",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA CAJON X DETRÁS",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA CAJON X DELANTE",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA CAJON COPA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA SISSY",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA A 1 PP CON TRX",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA EMPUJANDO FB",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA EMPUJANDO FB A 1 PP",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ISOMETRICO DE CUADRICEP 45\"+ 45\"",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CUADRICERA",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CUADRICERA + ISOM 15\" + 15\"",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VASTO INTERNO CON ELAS",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VASTO EXTERNO CON ELAS",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA ATRÁS 3:1: 3",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA ADELANTE 3:1:3",
        "category":  "PP CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP INES",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP + ELAS ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP INES + ELAS ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP SOBRE FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP SOBRE FB + ELAS ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD 2 PP ISOM 20\"",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP SOBRE MANC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP CON BARRA",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 2 PP EN TRX",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP INES",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP + ELAS ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP INES + ELAS ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP SOBRE FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP SOBRE FB + ELAS ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD 1 PP ISOM 20\"",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP SOBRE MANC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP CON BARRA",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD A 1 PP EN TRX",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD + MB EN ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELEV DE CAD + FB EN ADUC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS AL CIELO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS AL CIELO SOBRE INES",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS AL CIELO CON ELAS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS AL CIELO SOBRE FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS AL CIELO EN TRX",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS AL CIELO SOBRE MANC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SERRUCHO BI PODAL EN PUAS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SERRUCHO BI PODAL EN FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SERRUCHO BI PODAL SOBRE MANC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SERRUCHO UNI PODAL EN PUAS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SERRUCHO UNI PODAL EN FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SERRUCHO UNI PODAL SOBRE MANC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 1 PP ASISTIDO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 1 PP Y 1 BB CL o HL",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 1 P Y 2 BB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 1 PP CON BARRA",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PERO MUERTO A 1 PP SOBRE INES",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 1 PP + ELAS LAT",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 1 PP EN BARRA DE PNTA CL",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO A 2 BB CON MANC",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO CON BARRA",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESPEGUE CON BARRA DESDE PISO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESCENSO DE ISQUIOS A 2 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESCENSO DE ISQUIOS A 1 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESCENSO DE ISQUIOS FACILITADO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESCENSO DE ISQUIOS + CONCENTRICO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BUENOS DIAS A 1 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO CUERPO EN BNCO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO PEGANDO EN FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO CUERPO EN FB",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO ASISTIDO A 2 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO ASISTIDO A 1 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO A 2 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DETENTE INSTANTANEO A 1 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ELONG. DINAM. C/TIRANTE MUSCULADOR",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PASAJE + ABEDUC DE VALLAS CON SALT.",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CURL DE ISQUIOS A 1 PP CON ELAS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CURL DE ISQUIOS ISOM A 1 PP",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CULR DE ISQUIS ISOM CON ELAS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRACCION DE DISCO CON ISQUIOS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA ISQUIOS",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PESO MUERTO BULGARO",
        "category":  "PP CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD INEST A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD INEST",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD EN SPLIT A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD EN SPLT A 1 BB INES",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD A 1 BB Y EL OTRO ISOM",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRES ARNOLD ISOM",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD ALTERNO",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD ALTERNO INESTABLE",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD + ELAS LAT EN MANC 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD + ELAS LAT SOBRE INES",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD CON BARRA ROMANA",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD CON B. ROM. E INEST.",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD EN BARRA DE PNTA A 2 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD EN BARRA DE PNTA A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD EN B. PNTA A 2 BB INEST",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS ARNOLD EN B. PNTA A 1 BB INEST.",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD INEST A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD INEST",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD EN SPLIT A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD EN SPLT A 1 BB INES",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD ALTERNO",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + PRESS ARNOLD ALTERNO INESTABLE",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS LATERALES CON MANC",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS FRONTALES CON MANC",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS ALTERNOS CON MANC",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS LATERALES CON ELAS",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS FRONTALES CON ELAS",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS ALTERNOS CON ELAS",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS LATERALES CON ELAS A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELOS LATERALES CON MANC A 1 BB",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "VUELO FRONTAL CON BARRA",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RECHAZOS DE HOMBROS CON MANC",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO DE PIE CON MANC",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO DE PIE CON BARRA",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO DE PIE CON B. o MANC INESTABLE",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA ESTRICTA",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA ESTRICA CON DISC COLGANDO",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + VUELO LAT",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI + VUELO FRONT",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS + VUELO LAT",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PRESS + VUELO FRONT",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI+PRESS + VUELO LAT",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BI+PRESS + VUELO FRONT",
        "category":  "EMPUJE VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO PLANO A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO PLANO A 2 BB ALTERNO",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO PLANO A 2 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO DECLINADO A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO DECLINADO A 2 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO INCLINADO A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO INCLINADO A 2 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO PLANO",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO DECLINADO",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO INCLINADO",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO PLANO CON DISC. COLG.",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO DECLINADO CON DISC. COLG.",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO INCLINADO CON DISC. COLG.",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO TOMA CERRADA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FLOOR PRESS A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FLOOR PRESS A 2 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FLOOR PRESS CON BARRA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS PLANO CON MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS INCLINADO CON MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS DECLINADO CON MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS PLANO A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS INCLINADO A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS DECLINADO A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PECK DECK CON ELAS",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PECK DECK EN POLEA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN FB A 1 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN FB A 2 BB ALTERNO",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN FB A 2 BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB SOBRE MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB A 1 BB INES",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB A INES",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON PP ELEVADOS",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON BB ELEVADOS",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON BB SOBRE FB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON BB SOBRE TRX",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON PP SOBRE CAJON",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON PP SOBRE FB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB CON PP SOBRE TRX",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB DOBLE INEST",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES + REMO CON MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXT. + REMO CON MANC + APERTURA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULL OVER A 2 BB Y 1 MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULL OVER A 2 BB Y 2 MANC",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULL OVER + PRESS",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULL OVER CON BARRA CRUZADA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO 3 - 1 - 3",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB A 1 SOLO BB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES DE BB A 1 SOLO BB - INES",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FONDO DE TRICEP EN CAJON",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FONDO DE TRICEP EN PARALELAS",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS EQUI EN FB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO + APERTURA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "FZA EN BANCO + TRICEP FRANCES",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURA + TRICEP FRANCES",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRICEP CON ELASTICO",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRICEPS EN POLEA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRICEP A 1BB EN POLEA O ELAST",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRICEP FRANCER",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRICEP CON BARRA",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "APERTURAS EN FB",
        "category":  "EMPUJE HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRONES CON ELAST A 1 BB",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRONES EN POLEA A 1 BB",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRONES EN POLEA TOMA PALMAR",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRONES EN POLEA TOMA NEUTRA",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRONES EN POLEA TOMA NEUTRA ABIERTA",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRONES EN POLEA TOMA DORSAL",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRON EN POLEA CON SOGA A 1 BB",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIRON EN POLEA CON SOGA A 2 BB",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS ACOSTADO",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS ASISTIDO CON ELAS",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS SALTO Y EXCENTRICA EN 3\" O 5\"",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS NEUTRA",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS PALMAR",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS EN ANILLAS PALMAR",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS EN ANILLAS NEUTRA",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS EN ANILLAS",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOM. EN ANILLAS PASANDO POR 3 POS",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS CON KIMONO",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICEPS PARADO (B o M)",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICEPS SENTADO INCLINADO",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICEPS ACOSTADO BOCA ABAJO",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICEPS EXCENTRICO",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DOMINADAS SENTADO",
        "category":  "TRACCION VERTICAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO A 1 BB CON ELAS",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO A 1 BB EN POLEA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA TOMA NEUTRA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA TOMA NEUTRA ABIERTA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA TOMA PALMAR",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA TOMA DORSAL",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA CON SOGA A 1 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA CON SOGA A 2 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULL FACE",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN POLEA DORSAL A 2 o 3 POS",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO ACOSTADO CON MANC A 1 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO ACOSTADO CON MANC A 2 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO ACOSTADO CON MANC A 2 BB ALT.",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO ACOSTADO CON BARRA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO ACOSTADO CON B. TOMA PALMAR",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO ACOSTADO CON BARRA ROMANA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SERRUCHO",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SUSPENDIDO CON MANC A 1 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SUSPENDIDO CON MANC A 2 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SUSPENDIDO CON MANC A 2 BB ALT.",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SUSPENDIDO CON BARRA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SUSPENDIDO CON B. TOMA PALMAR",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO PARADO CON BARRA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO PARADO CON BARRA PALMAR",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO PARADO CON BARRA ROMMANA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX TOMA NEUTRA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX TOMA DORSAL",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX TOMA PALMAR",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX A 2 O 3 POS",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX A 1 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX A 1 PP APOYADO",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO EN TRX A 1 PP AP Y 1 BB",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO SUSP. CON SUELTA Y TOMA (B o M)",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "REMO CON SOGA EN B. DE PUNTA",
        "category":  "TRACCION HORIZONTAL",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO UNIBRAQUIAL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO UNIPODAL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO CADENA CRUZADA",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO HOMOLATERAL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO CON PESO CL o HL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO CON ELASTICO CL o HL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BICHO MUERTO 2 BB 2 PP",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CURL UP",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CURL UP a 1 PP",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS CON ELAS A 2 BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + CIRCULOS 2BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + PASO LATERA 2BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + VISAGRA DE CADERA 2 BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS CON ELAS A 1 BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + CIRCULOS 1BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + PASO LATERA 1BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + BISAGRA DE CADERA 1 BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS CON ELAS A 2 BB INESTABLE",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + CIRCULOS 2BB INESTABLE",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF P.+ GIRO DE TRONCO 2BB INES.",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF P.+ BISAGRA DE CADERA 2 BB INES.",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS A 2 BB Y 1 PP",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + DISCO PERTURBADOR",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALL OF PRESS + ROTACION",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES CLASICOS",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES RESISTIDOS CON ELAS",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES RES. ACEL. CON ELAS",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES RES. ACEL. CON PESO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES CON PESO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES CON PESO Y PP TRABADOS",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES + TWIST SOVIETICO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES + ADUCTORES",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES + ABEDUCTORES",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RUEDITA ABDOMINAL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES DE PP A 45 º",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES A 200 º",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES DE PP COLG.\"ROD. AL PECHO\"",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES DE PP COLG.\"FLEX. A 90º PP\"",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES DE PP COLG. \"PATADA CRAWL\"",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES DE PP COLGADO \"RELOJITO\"",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "OBLICUOS EN MAQUINA DE HEL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "OBLICUOS CON MANC",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TWIST SOVIETICO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TWIST DE PP (90º O 180º)",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TWIST EN FB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES EN FB Y PP TRABADOS",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RUEDITA ABDOMINAL DESDE PARADO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL A 2 BB (EST o INEST)",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL 1 BB (EST o INEST)",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONT. EN FB + REVOLVER OLLA",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ROTACIONES DE TRONCO (EST o INEST)",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GIROS CON DISCO PARADO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GIROS CON BARRA DE PNTA",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES BISAGRA CADENA CRUZADA",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES BISAGRA",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES HAMACA ISOM",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES HAMACA ISOM CON PESO",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES IEC",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES IEC + ADUCTORES",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDOMINALES IEC + ISQUIOS",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ROMPE PUBIS EN FB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL LLEVO Y TRAIGO MANC",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL \"ME PONGO LA MOCHILA\"",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL A 1 BB",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL BB EN INES",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL PP EN INES",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL DOBLE INES",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL A 1 PP",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA FRONTAL + ABEDUC DE PP",
        "category":  "ZONA MEDIA CADENA ANTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA INESTABLE PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA INEST. ESCAPULAS",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA DOBLE INESTABLE",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA 1PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA INESTABLE PP 1 PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRI. INEST. ESCAP. 1 PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA DOBLE INEST. 1 PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "LUMBARES ALTERNOS \"CAPRICHITO\"",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE PP ISOM 45º",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE PP A 1 PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE PP A 1 PP + ABEDUC 3\"",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE PP CEDIENTE EN 3\" (2 PP)",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE PP CEDIENTE EN 3\" (1 PP)",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL A 1 PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL ISOM",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL ISOM A 1 PP",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL CON BARRA",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HEL DE ARRANQUE CON ELAST",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA CON PP EN FB",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PLANCHA BOCA ARRIBA CON ESCAP. EN FB",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BUENOS DIAS",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BUENOS DIAS SENTADO",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BUENOS DIAS PANDA",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "LUMBARES A-W",
        "category":  "ZONA MEDIA CADENA POSTERIOR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS A 1 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS CON ELAS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS CON ELAS A 1 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS CON ELAS e INEST",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS ISOM 20\"",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS A 2 o 3 POS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS + REMO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ISOMETRICO DE ESCAPULAS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO A 1 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO A 2 o 3 POS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO + REMO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO + VUELO FRONT",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO A 1 PP 2 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO A 1 PP 1 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RECHAZOS DE ESCAPULA COLGADO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EXTENSIONES POR DETRÁS CON BARRA",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS EN TRX",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS EN TRX ISOM",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS SUSPENDIDO A 1 PP",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "HELADERO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CLAVAS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "T.G.U",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ISOM DE ESCAPULAS + ROTACION EXT EN FB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADO: TIRON + ROT + EMPUJE CON ELAS",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIO ARRANQUE",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MEDIO ARRANQUE ACOSTADO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ARRANQUE SENTADO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS CON CUELLO APOYADO",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RELOJITO PARADO CON ELAS A 2 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RELOJITO ACOSTADO CON MANC A 2 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "RELOJITO SUSPENDIDO CON MANC A 2 BB",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PALOMAS CON ELAS A-W",
        "category":  "CINTURA ESCAPULAR",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EQUILIBRIO A 1 PP SOBRE INESTABLES",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EQUILIBRIO A 2 PP SOBRE INESTABLES",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "EQUILIBRIO A 1 PP + ACTIVIDAD",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PIRAMIDAL CON ELASTICO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PIRAMIDAL CON ELASTICO INESTABLE",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PIRAMIDAL CON ELAST EXCENTRICO EN 3\"",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PIRAMIDAL EQUI",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PIRAMIDAL DE PIE CON ELASTICO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABDUC. DE PP CON ELAS. A 1 PP PIE EN FLEX.",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABEDUC. PP CON ELAS A 1 PP ACOST. EN FLEX.",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA DEL CANGREJO CON BANDA ADUC",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ABEDUCCION DE PP PARADO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ADUCTORES CON ELASTICO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRAPITO DE PIE",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TRAPITO SENTADO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIBIAL CON ELASTICO DE PIE",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TIBIAL CON BARRA DINAMICO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GEMELOS CON MANC SENTADO",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GEMELOS PARADO CON BARRA",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS DE BURRO PARA ISQ. CON ELAS",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PATADAS DE BURRO PARA ISQ. CON POL.",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA DEL CANGREJO 8x8",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DESLIZ. DE PP A 2 o 3 POS+BANDA ADUC.",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILLA LATERA DESLIZADA",
        "category":  "AUX DE PP",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULSEADAS AL REVES CON ELAS",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "PULSEADAS AL REVES CON MANC",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA DEL GRANJERO UNI BRAQUIAL",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA DEL GRANJERO + PRESS ISOM",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA DEL GRANJ. + B. CON PESO LAT.",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CAMINATA DEL GRANJ. + B. Y DISC COLG.",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "GATO BUENO - GATO MALO",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ROTACIONES DE TRONCO EN CUADRIPEDIA",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "MOVILIDAD DE CADERA EN CUADRIPEDIA",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SENTADILA LATERAL + FZA IPSILAT",
        "category":  "AUX DE MOVILIDAD",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "COORD EN ESCALERITA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "COORD EN CUADRILATERO",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TECNICA DE CARRERA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TECNICA DE CARRERA CON BANDA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "TECNICA DE CARRERA CONTRA LA PARED",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "CORRER CON ELAST DE RESISTENCIA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS A 2 PP EN PISO",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS A 2 PP EN ESC. o CUADRILAT.",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS EN ESTOCADA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS EN CORRALITO 2 PP",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS EN CORRALITO 2 PP HQ",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DJ A 2 PP",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS A 1 PP EN PISO",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS A 1 PP EN ESC. o CUAD.",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS EN CORRALITO 2 PP Y LAT 1 PP",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS EN CORRALITO 1 PP",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS EN CORRALITO 1 PP HQ",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "DJ A 1 PP",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS RANA LATERAL",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS AL CAJON",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTOS CON PESO",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "SALTO VERTICAL CON ELAS. RESISTENCIA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "ESC. CON SALT. Y COORD PARA MONTAÑA",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    },
    {
        "name":  "BURPEES",
        "category":  "PLIOMETRICOS",
        "source":  "PLANILLA FRANQUICIA CES 757"
    }
];



const $ = (selector) => document.querySelector(selector);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "guest" };
  } catch {
    return { role: "guest" };
  }
}

function saveSession(session) {
  currentSession = session;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  currentSession = { role: "guest" };
  sessionStorage.removeItem(SESSION_KEY);
}

function normalizeDni(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePin(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function isValidPin(value) {
  return /^\d{4,6}$/.test(normalizePin(value));
}

async function hashPin(pin) {
  const clean = normalizePin(pin);
  if (!window.crypto?.subtle) return clean;
  const bytes = new TextEncoder().encode(clean);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyPin(pin, stored) {
  const clean = normalizePin(pin);
  if (!stored) return false;
  if (stored === clean) return true;
  return await hashPin(clean) === stored;
}

function touchEntity(entity) {
  entity.updatedAt = new Date().toISOString();
  return entity;
}

function isSessionAbandoned(session) {
  const lastChange = new Date(session.updatedAt || session.startedAt).getTime();
  return Number.isFinite(lastChange) && Date.now() - lastChange > ABANDONED_SESSION_MS;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return ensurePresetProfiles(JSON.parse(saved));
  }

  const patientId = uid("patient");
  const routineId = uid("routine");
  return ensurePresetProfiles({
    patients: [
      {
        id: patientId,
        name: "Paciente demo",
        age: 42,
        phone: "+595 981 000 000",
        email: "paciente@kinepro.app",
        phase: "Fortalecimiento",
        history: "Dolor lumbar mecanico con buena tolerancia a ejercicio progresivo.",
        notes: "Controlar fatiga y tecnica durante bisagra de cadera.",
        createdAt: new Date().toISOString()
      }
    ],
    routines: [
      {
        id: routineId,
        patientId,
        name: "Estabilidad lumbopelvica",
        goal: "Mejorar control motor, fuerza y tolerancia funcional.",
        template: true,
        active: true,
        createdAt: new Date().toISOString(),
        exercises: [
          { id: uid("ex"), name: "Puente gluteo", sets: 3, reps: 12, load: "Banda media", progress: 0 },
          { id: uid("ex"), name: "Bird dog", sets: 3, reps: 10, load: "Peso corporal", progress: 0 },
          { id: uid("ex"), name: "Sentadilla asistida", sets: 4, reps: 8, load: "8 kg", progress: 0 }
        ]
      }
    ],
    activeSessions: [],
    history: []
  });
}

function ensurePresetProfiles(data) {
  data.patients ||= [];
  data.routines ||= [];
  data.activeSessions ||= [];
  data.history ||= [];
  data.athletes ||= [];
  data.exerciseLibrary ||= [];
  data.patients = data.patients.map((patient) => ({
    ...patient,
    dni: normalizeDni(patient.dni),
    historyPrivate: patient.historyPrivate ?? patient.history ?? "",
    visibleNotes: patient.visibleNotes ?? patient.publicNotes ?? "",
    updatedAt: patient.updatedAt || patient.createdAt || new Date().toISOString()
  }));
  data.athletes = data.athletes.map((athlete, index) => ({
    ...athlete,
    id: athlete.id || `athlete-${athlete.patientId || index}`,
    dni: normalizeDni(athlete.dni),
    pinHashOrPin: athlete.pinHashOrPin || athlete.pin || "",
    active: athlete.active !== false,
    updatedAt: athlete.updatedAt || athlete.createdAt || new Date().toISOString()
  }));
  data.activeSessions = data.activeSessions.map((session) => ({
    ...session,
    source: session.source || "admin",
    status: session.status || "active",
    paused: Boolean(session.paused),
    pauseStartedAt: session.pauseStartedAt || "",
    pausedMs: Number(session.pausedMs || 0),
    updatedAt: session.updatedAt || session.startedAt || new Date().toISOString()
  }));
  data.history = data.history.map((item, index) => ({
    ...item,
    id: item.id || `history-${item.finishedAt || item.startedAt || index}`,
    completedCount: item.completedCount ?? item.completed ?? 0,
    totalCount: item.totalCount ?? item.totalExercises ?? 0,
    notes: item.notes || "",
    createdAt: item.createdAt || item.finishedAt || new Date().toISOString(),
    executionData: item.executionData || []
  }));
  data.routines = data.routines.map((routine) => ({
    ...routine,
    obs: routine.obs ?? routine.goal ?? "",
    type: routine.type || (routine.template ? "template" : "assigned"),
    date: routine.date || routine.createdAt || new Date().toISOString(),
    updatedAt: routine.updatedAt || routine.createdAt || new Date().toISOString()
  }));
  data.exerciseLibrary = data.exerciseLibrary.map((exercise, index) => ({
    ...exercise,
    id: exercise.id || `custom-exercise-${index}`,
    custom: exercise.custom !== false,
    source: exercise.source || "Personalizado",
    updatedAt: exercise.updatedAt || exercise.createdAt || new Date().toISOString()
  }));

  presetProfiles().forEach((profile) => {
    const existingPatient = data.patients.find((patient) => patient.name.toLowerCase() === profile.patient.name.toLowerCase());
    const patientId = existingPatient?.id || profile.patient.id;

    if (!existingPatient) {
      data.patients.push({ ...profile.patient, id: patientId });
    }

    const hasRoutine = data.routines.some((routine) => (
      routine.patientId === patientId && routine.name.toLowerCase() === profile.routine.name.toLowerCase()
    ));

    if (!hasRoutine) {
      data.routines.push({
        ...profile.routine,
        id: profile.routine.id,
        patientId,
        exercises: profile.routine.exercises.map((exercise, index) => ({
          ...exercise,
          id: `${profile.routine.id}-ex-${index + 1}`
        }))
      });
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function presetProfiles() {
  return [
    {
      patient: {
        id: "patient-eric-graef",
        name: "Eric Graef",
        age: "",
        phone: "",
        email: "",
        phase: "Rutina activa",
        history: "Rutina cargada desde plan del 2026-04-24.",
        notes: "Trabajo de core, estabilidad, fuerza integrada, potencia y tren superior.",
        createdAt: "2026-04-24T12:00:00.000Z"
      },
      routine: {
        id: "routine-eric-graef-2026-04-24",
        name: "Rutina Eric Graef - 2026-04-24",
        goal: "Plan completo de fuerza integrada, estabilidad y potencia.",
        template: false,
        active: true,
        createdAt: "2026-04-24T12:00:00.000Z",
        exercises: [
          exerciseFromPrescription("Plancha alta a plancha baja con rodillas al pecho", "CORE / ESCAPULA / ESTABILIDAD", "4x3"),
          exerciseFromPrescription("Abductores en plancha lateral con disco", "CORE / ESCAPULA / ESTABILIDAD", "6x3 / 5kg - 10kg"),
          exerciseFromPrescription("Estocada + rotaciones con disco o pesa", "FUERZA INTEGRADA (PIERNAS + BRAZOS)", "6x3 / 10kg"),
          exerciseFromPrescription("Arrodillado a parado con biceps + hombro", "FUERZA INTEGRADA (PIERNAS + BRAZOS)", "4x3 / 7,5kg - 7,5kg - 10kg"),
          exerciseFromPrescription("Sentadilla con barra", "FUERZA TREN INFERIOR / POTENCIA", "4x3 / 59kg - 60kg - 65kg"),
          exerciseFromPrescription("Peso muerto + Remo", "AGREGADOS MANUALMENTE", "6x3 / 12,5kg - 15kg - 15kg"),
          exerciseFromPrescription("Subida al cajon con mancuernas + press hombro", "FUERZA TREN INFERIOR / POTENCIA", "6x3 / 10kg"),
          exerciseFromPrescription("Aductores con banda", "AGREGADOS MANUALMENTE", "4x3 cada pie"),
          exerciseFromPrescription("Saltos laterales a un pie", "AGREGADOS MANUALMENTE", "6x2 cada pie"),
          exerciseFromPrescription("Dominadas con peso", "FUERZA TREN SUPERIOR", "6x2 / 5kg")
        ]
      }
    },
    {
      patient: {
        id: "patient-ivo-canoniga",
        name: "Ivo Canoniga",
        age: "",
        phone: "",
        email: "",
        phase: "Rutina activa",
        history: "Rutina cargada desde plan del 2026-04-24.",
        notes: "Trabajo de core, estabilidad, tren superior, potencia y control integrado.",
        createdAt: "2026-04-24T12:00:00.000Z"
      },
      routine: {
        id: "routine-ivo-canoniga-2026-04-24",
        name: "Rutina Ivo Canoniga - 2026-04-24",
        goal: "Plan completo de core, estabilidad, fuerza superior y potencia.",
        template: false,
        active: true,
        createdAt: "2026-04-24T12:00:00.000Z",
        exercises: [
          exerciseFromPrescription("Plancha y pies (adentro, afuera, arriba y abajo)", "CORE / ESCAPULA / ESTABILIDAD", "4x3"),
          exerciseFromPrescription("Bicho muerto (y sus variantes)", "CORE / ESCAPULA / ESTABILIDAD", "6x3 / 5kg - 7kg"),
          exerciseFromPrescription("Superman", "CORE / ESCAPULA / ESTABILIDAD", "6x3 / 5kg"),
          exerciseFromPrescription("Vitalizacion en caballero con kettlebell invertida", "CORE / ESCAPULA / ESTABILIDAD", "6x3 / 5kg - 7,5kg"),
          exerciseFromPrescription("Rotaciones con banda arrodillado (Pallof press)", "CORE / ESCAPULA / ESTABILIDAD", "3x 30seg"),
          exerciseFromPrescription("Press de hombro con banda en la panza", "FUERZA TREN SUPERIOR", "6x3 / 10kg"),
          exerciseFromPrescription("Aductores con banda", "AGREGADOS MANUALMENTE", "4x3"),
          exerciseFromPrescription("Subida al cajon con mancuernas + press hombro", "FUERZA TREN INFERIOR / POTENCIA", "6x3 / 7,5kg"),
          exerciseFromPrescription("Flexiones de brazos con flexion de rodilla explosiva", "FUERZA TREN SUPERIOR", "6x3"),
          exerciseFromPrescription("Sentadilla + saltos potencia", "FUERZA TREN INFERIOR / POTENCIA", "4x3")
        ]
      }
    }
  ];
}

function exerciseFromPrescription(name, category, prescription) {
  const secondsMatch = prescription.match(/(\d+)\s*x\s*(\d+)\s*seg/i);
  const repsMatch = prescription.match(/(\d+)x\s*(\d+)/i);
  const match = secondsMatch || repsMatch;
  return {
    name,
    category,
    prescription,
    sets: match ? Number(match[1]) : 1,
    reps: secondsMatch ? "" : (match ? Number(match[2]) : 1),
    seconds: secondsMatch ? Number(secondsMatch[2]) : "",
    load: prescription.replace(match?.[0] || "", "").replace(/^ ?\/ ?/, "").trim() || prescription,
    progress: 0
  };
}

function formatExerciseDosage(exercise) {
  const series = exercise.sets ? `${exercise.sets} series` : "sin series";
  const reps = exercise.reps ? `${exercise.reps} reps` : null;
  const seconds = exercise.seconds ? `${exercise.seconds} seg` : null;
  const load = exercise.load ? escapeHtml(exercise.load) : "sin carga";
  return [series, reps, seconds, load].filter(Boolean).join(" &middot; ");
}

function buildPrescription(sets, reps, seconds, load) {
  const base = seconds ? `${sets}x${seconds}seg` : `${sets}x${reps}`;
  return load && load !== "Sin carga" ? `${base} / ${load}` : base;
}

function formatKgLoad(value) {
  const clean = String(value || "").trim();
  if (!clean) return "Sin carga";

  const normalized = clean.replace(/\./g, ",");
  if (/[a-z]/i.test(normalized) && !/kg/i.test(normalized)) {
    return normalized;
  }

  return normalized
    .replace(/\s*kg\b/gi, "kg")
    .replace(/(\d+(?:,\d+)?)(?!\s*kg)/gi, "$1kg");
}

function loadToInputValue(value) {
  const clean = String(value || "").trim();
  if (!clean || clean === "Sin carga") return "";
  return clean.replace(/\s*kg\b/gi, "");
}

function splitExercisePrescription(exercise) {
  const source = exercise.prescription || `${exercise.sets || ""}x${exercise.reps || ""} ${exercise.load || ""}`.trim();
  const secondsMatch = source.match(/(\d+)\s*x\s*(\d+)\s*seg/i);
  const repsMatch = source.match(/(\d+)\s*x\s*(\d+)/i);
  const match = secondsMatch || repsMatch;
  const remainder = match ? source.replace(match[0], "").replace(/^ ?\/ ?/, "").trim() : (exercise.load || "");

  return {
    series: match ? match[1] : (exercise.sets || "-"),
    reps: secondsMatch ? "-" : (match ? match[2] : (exercise.reps || "-")),
    seconds: secondsMatch ? secondsMatch[2] : "-",
    load: remainder || "-"
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  markSyncing();
  if (channel) {
    channel.postMessage({ type: "sync", state });
  }
  if (cloudEnabled && !applyingRemoteState) {
    return writeCloudState();
  }
  return Promise.resolve();
}

async function writeCloudState() {
  if (!firebaseSetDoc || !firebaseDoc || !firebaseCollection || !firebaseDb) return;
  try {
    const writes = Object.values(ENTITY_COLLECTIONS).flatMap(({ collection, key }) => (
      (state[key] || []).map((item) => {
        const id = item.id || uid(collection);
        item.id = id;
        item.updatedAt ||= new Date().toISOString();
        const ref = firebaseDoc(firebaseCollection(firebaseDb, collection), id);
        return firebaseSetDoc(ref, JSON.parse(JSON.stringify(item)), { merge: true });
      })
    ));
    await Promise.all(writes);
    markCloudSynced();
  } catch (error) {
    console.error("Firebase sync failed", error);
    markCloudError("Cambios pendientes");
  }
}

async function initCloudSync() {
  try {
    const firebaseAppModule = await import("https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js");
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js");
    const authModule = await import("https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js");
    const firebaseApp = firebaseAppModule.initializeApp(firebaseConfig);
    firebaseDb = firestoreModule.getFirestore(firebaseApp);
    firebaseAuth = authModule.getAuth(firebaseApp);
    cloudStateRef = firestoreModule.doc(firebaseDb, "kinepro", "shared-state");
    firebaseSetDoc = firestoreModule.setDoc;
    firebaseDeleteDoc = firestoreModule.deleteDoc;
    firebaseGetDoc = firestoreModule.getDoc;
    firebaseGetDocs = firestoreModule.getDocs;
    firebaseOnSnapshot = firestoreModule.onSnapshot;
    firebaseServerTimestamp = firestoreModule.serverTimestamp;
    firebaseCollection = firestoreModule.collection;
    firebaseDoc = firestoreModule.doc;
    firebaseSignInWithEmailAndPassword = authModule.signInWithEmailAndPassword;

    const snapshot = await firebaseGetDoc(cloudStateRef);
    if (snapshot.exists() && snapshot.data().state) {
      applyRemoteState(snapshot.data().state);
      migrateSharedStateToCollections(snapshot.data().state);
    }

    await seedEmptyCollectionsFromLocalState();
    listenToEntityCollections();
    cloudEnabled = true;
    markCloudSynced();
  } catch (error) {
    console.error("Firebase init failed", error);
    markCloudError();
  }
}

async function migrateSharedStateToCollections(remoteState) {
  if (!remoteState || localStorage.getItem("kinepro.collections.migrated") === "true") return;
  try {
    await writeCloudState();
    localStorage.setItem("kinepro.collections.migrated", "true");
  } catch (error) {
    console.error("Firebase migration failed", error);
  }
}

async function seedEmptyCollectionsFromLocalState() {
  if (!firebaseGetDocs || !firebaseCollection || !firebaseDb) return;
  const emptyChecks = await Promise.all(Object.values(ENTITY_COLLECTIONS).map(async ({ collection, key }) => {
    const snapshot = await firebaseGetDocs(firebaseCollection(firebaseDb, collection));
    return { key, empty: snapshot.empty };
  }));
  if (emptyChecks.some((item) => item.empty && (state[item.key] || []).length)) {
    await writeCloudState();
  }
}

function listenToEntityCollections() {
  Object.values(ENTITY_COLLECTIONS).forEach(({ collection, key }) => {
    firebaseOnSnapshot(firebaseCollection(firebaseDb, collection), (snapshot) => {
      applyingRemoteState = true;
      state[key] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ensurePresetProfiles(state)));
      renderAll();
      applyingRemoteState = false;
      const pending = snapshot.metadata?.hasPendingWrites;
      pending ? markPendingChanges() : markCloudSynced();
    }, (error) => {
      console.error(`Firebase realtime sync failed for ${collection}`, error);
      markCloudError();
    });
  });
}

async function deleteCloudEntity(entityKey, id) {
  if (!cloudEnabled || !firebaseDeleteDoc || !firebaseDoc || !firebaseCollection || !firebaseDb || !id) return;
  try {
    const config = ENTITY_COLLECTIONS[entityKey];
    if (!config) return;
    await firebaseDeleteDoc(firebaseDoc(firebaseCollection(firebaseDb, config.collection), id));
  } catch (error) {
    console.error("Firebase delete failed", error);
    markCloudError("Cambios pendientes");
  }
}

function applyRemoteState(remoteState) {
  if (!remoteState) return;
  applyingRemoteState = true;
  const nextState = ensurePresetProfiles(remoteState);
  Object.assign(state, nextState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
  applyingRemoteState = false;
  markCloudSynced();
}

function markSyncing() {
  if (!navigator.onLine) {
    markCloudError("Sin conexion");
    return;
  }
  $("#sync-label").textContent = "Sincronizando";
  $("#sync-detail").textContent = "Guardando cambios clinicos";
  $("#sync-dot").style.background = "var(--amber)";
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (cloudEnabled) {
      markPendingChanges();
    } else {
      $("#sync-label").textContent = "Cambios pendientes";
      $("#sync-detail").textContent = "Se guardaron localmente";
      $("#sync-dot").style.background = "var(--amber)";
    }
  }, 650);
}

function markCloudSynced() {
  $("#sync-label").textContent = navigator.onLine ? "Online" : "Sin conexion";
  $("#sync-detail").textContent = "Firebase en tiempo real activo";
  $("#sync-dot").style.background = "var(--green)";
}

function markPendingChanges() {
  $("#sync-label").textContent = "Cambios pendientes";
  $("#sync-detail").textContent = "Esperando confirmacion de Firebase";
  $("#sync-dot").style.background = "var(--amber)";
}

function markCloudError(label = "Sin conexion") {
  $("#sync-label").textContent = navigator.onLine ? label : "Sin conexion";
  $("#sync-detail").textContent = "No se confirmo guardado remoto";
  $("#sync-dot").style.background = "var(--red)";
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function elapsedSeconds(session) {
  const started = new Date(session.startedAt).getTime();
  const reference = session.paused && session.pauseStartedAt ? new Date(session.pauseStartedAt).getTime() : Date.now();
  const pausedMs = Number(session.pausedMs || 0);
  return Math.max(0, Math.floor((reference - started - pausedMs) / 1000));
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${m}:${s}`;
  }
  return `${m}:${s}`;
}

function getPatient(id) {
  return state.patients.find((patient) => patient.id === id);
}

function getRoutine(id) {
  return state.routines.find((routine) => routine.id === id);
}

function getInitials(name) {
  return String(name || "KP")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getPatientStats(patientId) {
  return {
    routines: state.routines.filter((routine) => routine.patientId === patientId),
    sessions: state.history.filter((item) => item.patientId === patientId)
  };
}

function getAthleteAccessByPatient(patientId) {
  return state.athletes.find((athlete) => athlete.patientId === patientId && athlete.active !== false);
}

function getAthleteAccessByDni(dni) {
  const normalized = normalizeDni(dni);
  return state.athletes.find((athlete) => athlete.dni === normalized && athlete.active !== false);
}

function hasDuplicateDni(dni, patientId = "") {
  const normalized = normalizeDni(dni);
  if (!normalized) return false;
  return state.patients.some((patient) => patient.id !== patientId && normalizeDni(patient.dni) === normalized);
}

function getAthletePatient() {
  if (currentSession.role !== "athlete") return null;
  const access = getAthleteAccessByDni(currentSession.dni);
  return access ? getPatient(access.patientId) : null;
}

function getExerciseNumericValue(value, fallback = 0) {
  const normalized = String(value ?? "").replace(",", ".").replace(/[^\d.]/g, "");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : fallback;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRoutineDisplayName(routine, patient = getPatient(routine.patientId)) {
  const patientName = patient?.name || "";
  let routineName = routine.name || "Rutina";

  if (patientName) {
    routineName = routineName
      .replace(/^rutina\s*/i, "")
      .replace(new RegExp(escapeRegExp(patientName), "ig"), "")
      .replace(/\s+/g, " ")
      .replace(/^\s*-\s*/, "")
      .replace(/\s*-\s*$/, "")
      .trim();

    return routineName ? `${patientName} - ${routineName}` : patientName;
  }

  return routineName;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getCombinedExerciseLibrary() {
  return [
    ...EXERCISE_LIBRARY.map((exercise, index) => ({ ...exercise, id: exercise.id || `base-${index}`, custom: false })),
    ...(state.exerciseLibrary || []).map((exercise) => ({ ...exercise, custom: true }))
  ];
}

function getExerciseLibraryCategories() {
  return [...new Set(getCombinedExerciseLibrary().map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getFilteredExerciseLibrary() {
  const category = $("#exercise-category-filter")?.value || "";
  const query = ($("#exercise-library-search")?.value || "").trim().toLowerCase();
  return getCombinedExerciseLibrary()
    .map((item, index) => ({ ...item, index }))
    .filter((item) => !category || item.category === category)
    .filter((item) => {
      if (!query) return true;
      return `${item.name} ${item.category} ${item.source} ${item.type || ""} ${item.equipment || ""}`.toLowerCase().includes(query);
    });
}

function findLibraryExerciseByName(name) {
  const normalized = String(name || "").trim().toLowerCase();
  return getCombinedExerciseLibrary().find((item) => item.name.toLowerCase() === normalized);
}

function renderExerciseLibrary() {
  const categorySelect = $("#exercise-category-filter");
  const searchInput = $("#exercise-library-search");
  const exerciseSelect = $("#exercise-library-select");
  const countNode = $("#exercise-library-count");
  if (!categorySelect || !searchInput || !exerciseSelect || !countNode) return;

  const selectedCategory = categorySelect.value;
  const categories = getExerciseLibraryCategories();
  categorySelect.innerHTML = [
    "<option value=''>Todas las categorias</option>",
    ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
  ].join("");
  categorySelect.value = categories.includes(selectedCategory) ? selectedCategory : "";

  const exercises = getFilteredExerciseLibrary();
  exerciseSelect.innerHTML = exercises.length ? exercises.map((item) => (
    `<option value="${item.index}">${escapeHtml(item.name)} - ${escapeHtml(item.category || item.source)}</option>`
  )).join("") : "<option value=''>Sin resultados</option>";
  countNode.textContent = `${exercises.length} ejercicios`;
}

function useLibraryExercise() {
  const selectedIndex = Number($("#exercise-library-select")?.value);
  const exercise = getCombinedExerciseLibrary()[selectedIndex];
  if (!exercise) return;

  const nameInput = $("#exercise-name");
  nameInput.value = exercise.name;
  nameInput.dataset.libraryCategory = exercise.category || "";
  nameInput.dataset.librarySource = exercise.source || "";
  $("#exercise-sets").focus();
}

function renderCustomExerciseLibrary() {
  const list = $("#custom-exercise-list");
  if (!list) return;
  list.innerHTML = (state.exerciseLibrary || []).map((exercise) => `
    <article class="entity-card compact-card">
      <header>
        <div>
          <h3>${escapeHtml(exercise.name)}</h3>
          <div class="meta-line">${escapeHtml(exercise.category || "Sin categoria")} &middot; ${escapeHtml(exercise.type || "General")} ${exercise.equipment ? `&middot; ${escapeHtml(exercise.equipment)}` : ""}</div>
        </div>
        <button class="danger-action compact-action" data-delete-custom-exercise="${exercise.id}" type="button">Eliminar</button>
      </header>
      ${exercise.description ? `<p class="compact-description">${escapeHtml(exercise.description)}</p>` : ""}
    </article>
  `).join("") || "<div class='empty-state'>Sin biblioteca personalizada. Agrega tu primer ejercicio personalizado.</div>";
}

function addCustomExercise(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name") || "").trim();
  if (!name) return;
  const now = new Date().toISOString();
  state.exerciseLibrary.unshift({
    id: uid("exercise"),
    name,
    category: String(form.get("category") || "").trim(),
    description: String(form.get("description") || "").trim(),
    type: String(form.get("type") || "").trim(),
    equipment: String(form.get("equipment") || "").trim(),
    source: "Personalizado",
    custom: true,
    createdAt: now,
    updatedAt: now
  });
  event.currentTarget.reset();
  persist();
  renderAll();
}

function deleteCustomExercise(exerciseId) {
  const exercise = state.exerciseLibrary.find((item) => item.id === exerciseId);
  if (!exercise) return;
  if (!window.confirm(`Eliminar el ejercicio personalizado "${exercise.name}"?`)) return;
  state.exerciseLibrary = state.exerciseLibrary.filter((item) => item.id !== exerciseId);
  deleteCloudEntity("exerciseLibrary", exerciseId);
  persist();
  renderAll();
}

function renderAccessShell() {
  const isAdmin = currentSession.role === "admin";
  const isAthlete = currentSession.role === "athlete";
  document.body.classList.toggle("admin-mode", isAdmin);
  document.body.classList.toggle("athlete-mode", isAthlete);
  $("#access-screen").hidden = isAdmin || isAthlete;
  document.querySelector(".app-shell").hidden = !isAdmin;
  $("#athlete-portal").hidden = !isAthlete;

  if (isAdmin) {
    const activeView = document.querySelector(".view.active")?.id || "dashboard";
    switchView(activeView);
  }

  if (isAthlete) {
    renderAthletePortal();
  }
}

async function adminLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const message = $("#admin-login-message");
  const matchesLocalAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
  try {
    if (!email || !password) {
      message.textContent = "Ingrese email y contrasena de administrador.";
      return;
    }
    if (firebaseSignInWithEmailAndPassword && firebaseAuth) {
      await firebaseSignInWithEmailAndPassword(firebaseAuth, email, password);
    } else if (!matchesLocalAdmin) {
      message.textContent = "Credenciales de administrador incorrectas.";
      return;
    }
  } catch (error) {
    console.error("Admin auth failed", error);
    if (!matchesLocalAdmin) {
      message.textContent = "No se pudo validar el administrador.";
      return;
    }
  }
  message.textContent = "";
  saveSession({ role: "admin", email });
  renderAccessShell();
  renderAll();
}

function logout() {
  clearSession();
  closePatientProfile();
  $("#athlete-login-message").textContent = "";
  $("#admin-login-message").textContent = "";
  $("#admin-login-form").hidden = true;
  renderAccessShell();
}

function athleteLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const dni = normalizeDni(form.get("dni"));
  const message = $("#athlete-login-message");
  const access = getAthleteAccessByDni(dni);
  const patient = access ? getPatient(access.patientId) : null;

  if (!dni || !access || !patient) {
    message.textContent = "No hay un acceso deportista activo para ese DNI.";
    return;
  }

  message.textContent = "";
  saveSession({ role: "athlete", dni });
  renderAccessShell();
  renderAll();
}

function createAthleteAccess(patientId) {
  const patient = getPatient(patientId);
  if (!patient) return;
  const dni = normalizeDni(patient.dni);

  if (!dni) {
    window.alert("Cargue el DNI en la ficha antes de crear el acceso deportista.");
    return;
  }

  if (hasDuplicateDni(dni, patient.id)) {
    window.alert("Ya existe otro paciente con el mismo DNI. Corrija el duplicado antes de crear el acceso.");
    return;
  }

  const existing = getAthleteAccessByDni(dni);
  if (existing && existing.patientId !== patient.id) {
    window.alert("Ese DNI ya esta vinculado a otro deportista.");
    return;
  }

  if (existing) {
    existing.active = true;
    touchEntity(existing);
    persist();
    renderAll();
    return;
  }

  state.athletes.unshift({
    id: uid("athlete"),
    patientId: patient.id,
    dni,
    pinHashOrPin: "",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  persist();
  renderAll();
}

function deleteAthleteAccess(accessId) {
  const access = state.athletes.find((item) => item.id === accessId);
  if (!access) return;
  if (!window.confirm("Eliminar el acceso deportista para este DNI?")) return;
  state.athletes = state.athletes.filter((item) => item.id !== accessId);
  deleteCloudEntity("athletes", accessId);
  persist();
  renderAll();
}

function renderAthleteAccessAdmin() {
  const select = $("#athlete-patient-select");
  const list = $("#athlete-users-list");
  if (!select || !list) return;

  select.innerHTML = state.patients.map((patient) => (
    `<option value="${patient.id}">${escapeHtml(patient.name)}${patient.dni ? ` - DNI ${escapeHtml(patient.dni)}` : " - sin DNI"}</option>`
  )).join("") || "<option value=''>Cargue un paciente</option>";

  list.innerHTML = state.athletes.map((access) => {
    const patient = getPatient(access.patientId);
    return `
      <article class="entity-card">
        <header>
          <div>
            <h3>${escapeHtml(patient?.name || "Paciente eliminado")}</h3>
            <div class="meta-line">DNI ${escapeHtml(access.dni)} &middot; ingreso sin PIN &middot; ${access.active === false ? "inactivo" : "activo"}</div>
          </div>
          <button class="danger-action" data-delete-athlete-access="${access.id}" type="button">Eliminar</button>
        </header>
      </article>
    `;
  }).join("") || "<div class='empty-state'>Todavia no hay accesos deportistas.</div>";
}

function renderReadOnlyRoutine(routine, patient) {
  const createdAt = routine.createdAt ? formatDateTime(routine.createdAt).split(",")[0] : "Sin fecha";
  return `
    <details class="entity-card athlete-fold athlete-routine-card athlete-card collapsible-card">
      <summary class="athlete-summary">
        <div>
          <h3>${escapeHtml(getRoutineDisplayName(routine, patient))}</h3>
          <div class="meta-line">${escapeHtml(createdAt)} &middot; ${routine.exercises.length} ejercicios &middot; ${routine.active === false ? "inactiva" : "activa"}</div>
        </div>
        <div class="athlete-summary-actions">
          <button class="primary-action athlete-primary-action" data-athlete-start-routine="${routine.id}" type="button">Iniciar rutina</button>
          <span class="chip stable">${routine.active === false ? "pausada" : "asignada"}</span>
        </div>
      </summary>
      ${routine.goal ? `<p class="athlete-goal">${escapeHtml(routine.goal)}</p>` : ""}
      <div class="exercise-list">
        ${routine.exercises.map((exercise) => `
          <div class="exercise-row">
            <span>
              ${escapeHtml(exercise.name)}
              <small>${formatExerciseDosage(exercise)}${exercise.notes ? ` &middot; ${escapeHtml(exercise.notes)}` : ""}</small>
            </span>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

function renderAthletePortal() {
  const patient = getAthletePatient();
  if (!patient) {
    $("#athlete-name").textContent = "Acceso no disponible";
    $("#athlete-profile-card").innerHTML = "<div class='empty-state'>No se encontro una ficha vinculada a este DNI.</div>";
    $("#athlete-routines-list").innerHTML = "";
    $("#athlete-history-panel").innerHTML = "";
    $("#athlete-session-panel").hidden = true;
    return;
  }

  const stats = getPatientStats(patient.id);
  const activeSession = state.activeSessions.find((session) => session.patientId === patient.id);
  const lastSession = stats.sessions[0];
  const totalVolume = stats.sessions.reduce((sum, item) => sum + Number(item.volume || 0), 0);
  const averageProgress = stats.sessions.length
    ? Math.round(stats.sessions.reduce((sum, item) => sum + Number(item.progress || 0), 0) / stats.sessions.length)
    : 0;

  $("#athlete-name").textContent = patient.name;
  const athleteSubtitle = $("#athlete-subtitle");
  if (athleteSubtitle) {
    athleteSubtitle.textContent = `Hola ${patient.name}. Este es tu espacio de entrenamiento.`;
  }
  const banner = $("#athlete-active-banner");
  if (banner) {
    banner.hidden = !activeSession;
    banner.innerHTML = activeSession ? `
      <span>Tenes una sesion en curso</span>
      <strong data-athlete-timer="${activeSession.id}">${formatDuration(elapsedSeconds(activeSession))}</strong>
      <button class="primary-action compact-action athlete-primary-action" data-scroll-active-session type="button">Continuar</button>
    ` : "";
  }
  $("#athlete-profile-card").innerHTML = `
    <details class="panel athlete-fold athlete-profile-fold athlete-card collapsible-card">
      <summary class="athlete-summary">
        <div>
          <p class="eyebrow">Ficha personal</p>
          <h2>${escapeHtml(patient.name)}</h2>
          <div class="meta-line">DNI ${escapeHtml(patient.dni || currentSession.dni)} &middot; ${stats.routines.length} rutinas &middot; ${stats.sessions.length} sesiones</div>
        </div>
        <span class="chip stable">${escapeHtml(patient.phase || "activo")}</span>
      </summary>
      <div class="athlete-kpi-grid">
        <article><span>Telefono</span><strong>${escapeHtml(patient.phone || "-")}</strong></article>
        <article><span>Email</span><strong>${escapeHtml(patient.email || "-")}</strong></article>
        <article><span>Rutinas</span><strong>${stats.routines.length}</strong></article>
        <article><span>Sesiones</span><strong>${stats.sessions.length}</strong></article>
      </div>
      <div class="athlete-readonly-block">
        <span>Observaciones visibles</span>
        <p>${escapeHtml(patient.visibleNotes || "Sin observaciones visibles para el deportista.")}</p>
      </div>
      <div class="athlete-readonly-block">
        <span>Estado del tratamiento</span>
        <p>${escapeHtml(patient.phase || "Activo")}</p>
      </div>
    </details>
  `;

  const sessionPanel = $("#athlete-session-panel");
  sessionPanel.hidden = !activeSession;
  sessionPanel.innerHTML = activeSession ? renderAthleteActiveSession(activeSession) : "";

  $("#athlete-routines-list").innerHTML = stats.routines.map((routine) => renderReadOnlyRoutine(routine, patient)).join("") || "<div class='empty-state'>Todavia no tenes rutinas asignadas.</div>";
  $("#athlete-history-panel").innerHTML = `
    <details class="panel athlete-fold athlete-history-fold athlete-card collapsible-card">
      <summary class="athlete-summary">
        <div>
          <p class="eyebrow">Actividad</p>
          <h2>Historial de sesiones</h2>
          <div class="meta-line">${stats.sessions.length} sesiones &middot; ultima: ${lastSession ? formatDateTime(lastSession.finishedAt) : "sin registros"} &middot; progreso ${averageProgress}% &middot; volumen ${Math.round(totalVolume)}</div>
        </div>
        <span class="chip stable">${formatDuration(lastSession?.duration || 0)}</span>
      </summary>
      <div class="entity-list">
        ${stats.sessions.map((item) => renderAthleteHistoryItem(item)).join("") || "<div class='empty-state'>Todavia no tenes sesiones registradas.</div>"}
      </div>
    </details>
  `;
}

function renderAthleteActiveSession(session) {
  const routine = getRoutine(session.routineId);
  const completed = session.exercises.filter((exercise) => exercise.done).length;
  const progress = Math.round((completed / Math.max(1, session.exercises.length)) * 100);
  return `
    <div class="athlete-session-head">
      <div>
        <p class="eyebrow">Sesion en curso</p>
        <h2>${escapeHtml(routine ? getRoutineDisplayName(routine) : "Rutina")}</h2>
        <div class="meta-line">${completed}/${session.exercises.length} ejercicios &middot; progreso ${progress}%</div>
      </div>
      <strong class="timer" data-athlete-timer="${session.id}">${formatDuration(elapsedSeconds(session))}</strong>
    </div>
    <div class="load-meter"><span style="width: ${progress}%;"></span></div>
    <div class="button-row athlete-session-actions">
      <button class="secondary-action" data-athlete-pause-session="${session.id}" type="button">${session.paused ? "Reanudar" : "Pausar"}</button>
      <button class="danger-action" data-athlete-finish-session="${session.id}" type="button">Finalizar rutina</button>
    </div>
    <div class="exercise-list athlete-execution-list compact-athlete-execution-list">
      ${session.exercises.map((exercise, index) => `
        <details class="athlete-exercise-compact ${exercise.done ? "done" : ""}" ${!exercise.done && index === completed ? "open" : ""}>
          <summary class="athlete-exercise-summary">
            <div class="athlete-exercise-main">
              <h3>${escapeHtml(exercise.name)}</h3>
              <div class="meta-line">Plan: ${formatExerciseDosage(exercise)}</div>
            </div>
            <span class="chip ${exercise.done ? "stable" : "controlled"}">${exercise.done ? "completo" : "pendiente"}</span>
            <button class="${exercise.done ? "secondary-action" : "primary-action athlete-primary-action"}" data-athlete-toggle-exercise="${session.id}:${exercise.id}" type="button">
              ${exercise.done ? "Realizado" : "Marcar"}
            </button>
          </summary>
          <div class="athlete-exercise-detail">
            <div class="athlete-execution-grid">
              <label>Series<input data-athlete-input="${session.id}:${exercise.id}:actualSets" inputmode="numeric" value="${escapeHtml(exercise.actualSets || "")}" placeholder="${escapeHtml(exercise.sets || "")}"></label>
              <label>Reps<input data-athlete-input="${session.id}:${exercise.id}:actualReps" inputmode="numeric" value="${escapeHtml(exercise.actualReps || "")}" placeholder="${escapeHtml(exercise.reps || "")}"></label>
              <label>Kg<input data-athlete-input="${session.id}:${exercise.id}:actualLoad" inputmode="decimal" value="${escapeHtml(loadToInputValue(exercise.actualLoad || ""))}" placeholder="${escapeHtml(loadToInputValue(exercise.load || ""))}"></label>
              <label>Seg<input data-athlete-input="${session.id}:${exercise.id}:actualSeconds" inputmode="numeric" value="${escapeHtml(exercise.actualSeconds || "")}" placeholder="${escapeHtml(exercise.seconds || "")}"></label>
            </div>
            <label class="athlete-notes-input">Observaciones<textarea data-athlete-input="${session.id}:${exercise.id}:athleteNotes" rows="2" placeholder="Notas de esta ejecucion">${escapeHtml(exercise.athleteNotes || "")}</textarea></label>
          </div>
        </details>
      `).join("")}
    </div>
  `;
}

function renderAthleteHistoryItem(item) {
    const routine = getRoutine(item.routineId);
    return `
      <article class="entity-card patient-card">
        <header>
          <div>
            <h3>${escapeHtml(routine?.name || item.routineName || "Sesion")}</h3>
            <div class="meta-line">${formatDateTime(item.finishedAt)}</div>
          </div>
          <span class="chip stable">${formatDuration(item.duration)}</span>
        </header>
        <div class="stats-row">
          <span class="stat-pill">${item.completed}/${item.totalExercises} ejercicios</span>
          <span class="stat-pill">Volumen ${item.volume}</span>
          <span class="stat-pill">Progreso ${item.progress}%</span>
        </div>
        ${renderExecutionData(item)}
      </article>
    `;
}

function renderClock() {
  const now = new Date();
  $("#current-date").textContent = new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(now);
  $("#current-time").textContent = new Intl.DateTimeFormat("es-PY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(now);
}

function renderMetrics() {
  const active = state.activeSessions.length;
  $("#metric-patients").textContent = state.patients.length;
  $("#metric-routines").textContent = state.routines.filter((routine) => routine.active).length;
  $("#metric-active").textContent = active;
  $("#metric-history").textContent = state.history.length;

  const status = getLoadStatus(active);
  $("#load-message").textContent = status.message;
  $("#system-state").textContent = status.title;
  $("#system-description").textContent = status.description;
  $("#load-chip").textContent = status.label;
  $("#load-chip").className = `chip ${status.className}`;
  $("#session-count-chip").textContent = `${active} activas`;
  $("#session-count-chip").className = `chip ${status.className}`;
  $("#load-bar").style.width = `${status.width}%`;
  $("#load-bar").style.background = status.color;
}

function getLoadStatus(active) {
  if (active >= 5) {
    return {
      title: "Carga alta",
      label: "supervision",
      className: "high",
      message: "carga alta",
      width: 100,
      color: "var(--red)",
      description: "Muchas sesiones activas. Conviene supervisar tiempos, tecnica y cierre de registros."
    };
  }
  if (active >= 2) {
    return {
      title: "Actividad controlada",
      label: "controlado",
      className: "controlled",
      message: "actividad controlada",
      width: 58,
      color: "var(--amber)",
      description: "Volumen moderado. El consultorio opera con seguimiento simultaneo activo."
    };
  }
  return {
    title: "Sistema estable",
    label: "estable",
    className: "stable",
    message: "sistema estable",
    width: Math.max(8, active * 24),
    color: "var(--green)",
    description: "Carga baja. El consultorio puede iniciar nuevas sesiones sin alertas."
  };
}

function renderPatientOptions() {
  const patientOptions = state.patients
    .map((patient) => `<option value="${patient.id}">${escapeHtml(patient.name)}</option>`)
    .join("");
  $("#routine-patient").innerHTML = patientOptions || "<option value=''>Registre un paciente</option>";
  $("#session-patient").innerHTML = patientOptions || "<option value=''>Registre un paciente</option>";
  renderSessionRoutineOptions();
}

function renderSessionRoutineOptions() {
  const patientId = $("#session-patient").value;
  const routines = state.routines.filter((routine) => routine.patientId === patientId || routine.template);
  $("#session-routine").innerHTML = routines
    .map((routine) => `<option value="${routine.id}">${escapeHtml(getRoutineDisplayName(routine))}</option>`)
    .join("") || "<option value=''>Cree una rutina</option>";
}

function renderPatients() {
  const query = $("#patient-search").value.trim().toLowerCase();
  const list = state.patients.filter((patient) => `${patient.name} ${patient.dni || ""}`.toLowerCase().includes(query));
  $("#patients-list").innerHTML = list.map((patient) => {
    const stats = getPatientStats(patient.id);
    const access = getAthleteAccessByPatient(patient.id);
    const activeSession = state.activeSessions.find((session) => session.patientId === patient.id);
    const lastSession = stats.sessions[0];
    return `
      <article class="entity-card">
        <header class="patient-card-head">
          <div class="patient-card-title">
            <h3>${escapeHtml(patient.name)}</h3>
            <div class="meta-line">${patient.age} anos &middot; DNI ${escapeHtml(patient.dni || "-")} &middot; ${escapeHtml(patient.phase)}</div>
          </div>
          <span class="chip ${activeSession ? "controlled" : access ? "stable" : "high"}">${activeSession ? "Sesion activa" : access ? "Acceso activo" : "Acceso pendiente"}</span>
        </header>
        <div class="stats-row">
          <span class="stat-pill">${stats.routines.length} rutinas</span>
          <span class="stat-pill">${stats.sessions.length} sesiones</span>
          <span class="stat-pill">${lastSession ? `Ultima ${formatDateTime(lastSession.finishedAt)}` : "Sin sesiones"}</span>
        </div>
        <div class="button-row">
          <button class="primary-action" data-open-patient="${patient.id}" type="button">Ver ficha</button>
          <button class="secondary-action" data-new-routine-patient="${patient.id}" type="button">Crear rutina</button>
          <button class="secondary-action" data-start-first-routine="${patient.id}" type="button">Iniciar sesion</button>
          <button class="secondary-action" data-create-athlete="${patient.id}" type="button">Crear acceso</button>
          <button class="secondary-action" data-print-patient="${patient.id}" type="button">PDF / imprimir ficha</button>
        </div>
      </article>
    `;
  }).join("") || "<div class='empty-state'>Sin pacientes. Crea tu primer paciente desde el formulario.</div>";
}

function openPatientProfile(patientId) {
  selectedPatientId = patientId;
  renderPatientProfile();
  document.querySelector(".profile-routines").hidden = false;
  document.querySelector(".profile-sessions").hidden = true;
  document.querySelectorAll(".profile-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.profileTab === "routines");
  });
  $("#patient-profile").hidden = false;
}

function closePatientProfile() {
  selectedPatientId = null;
  $("#patient-profile").hidden = true;
  $("#profile-form").hidden = true;
}

function renderPatientProfile() {
  const patient = getPatient(selectedPatientId);
  if (!patient) return;

  const stats = getPatientStats(patient.id);
  $("#profile-avatar").textContent = getInitials(patient.name);
  $("#profile-name").textContent = patient.name;
  $("#profile-phase").textContent = patient.phase || "Activo";
  $("#profile-age").textContent = patient.age || "-";
  $("#profile-phone").textContent = patient.phone || "-";
  $("#profile-email").textContent = patient.email || "Sin email";
  $("#profile-dni").textContent = patient.dni || "-";
  $("#profile-sessions").textContent = stats.sessions.length;
  $("#profile-history").textContent = patient.history || "Sin antecedentes cargados.";
  $("#profile-notes").textContent = patient.notes || "Sin observaciones cargadas.";
  const access = getAthleteAccessByPatient(patient.id);
  const accessStatus = $("#profile-access-status");
  if (accessStatus) {
    accessStatus.innerHTML = access
      ? `<span class="chip stable">Activa</span><p>DNI ${escapeHtml(access.dni)} habilitado para ingreso sin PIN.</p>`
      : `<span class="chip controlled">Pendiente</span><p>Este paciente todavia no tiene acceso deportista.</p>`;
  }

  const form = $("#profile-form");
  form.elements.name.value = patient.name || "";
  form.elements.age.value = patient.age || "";
  form.elements.dni.value = patient.dni || "";
  form.elements.phone.value = patient.phone || "";
  form.elements.email.value = patient.email || "";
  form.elements.phase.value = patient.phase || "";
  form.elements.history.value = patient.history || "";
  form.elements.notes.value = patient.notes || "";
  if (form.elements.visibleNotes) form.elements.visibleNotes.value = patient.visibleNotes || "";

  $("#profile-routines-list").innerHTML = stats.routines.map((routine) => `
    <article class="entity-card">
      <header>
        <div>
          <h3>${escapeHtml(getRoutineDisplayName(routine, patient))}</h3>
          <div class="meta-line">${routine.exercises.length} ejercicios</div>
        </div>
        ${routineMenu(routine, routine.template ? "plantilla" : "rutina")}
      </header>
    </article>
  `).join("") || "<div class='empty-state'>Este paciente todavia no tiene rutinas.</div>";

  $("#profile-history-list").innerHTML = stats.sessions.map((item) => {
    const routine = getRoutine(item.routineId);
    return `
      <article class="entity-card">
        <header>
          <div>
            <h3>${escapeHtml(routine?.name ?? item.routineName)}</h3>
            <div class="meta-line">${formatDateTime(item.finishedAt)}</div>
          </div>
          ${historyMenu(item)}
        </header>
        <div class="stats-row">
          <span class="stat-pill">${item.completed}/${item.totalExercises} ejercicios</span>
          <span class="stat-pill">Volumen ${item.volume}</span>
          <span class="stat-pill">Progreso ${item.progress}%</span>
        </div>
        ${renderExecutionData(item)}
      </article>
    `;
  }).join("") || "<div class='empty-state'>Este paciente todavia no tiene sesiones registradas.</div>";
}

function routineMenu(routine, label = "activa") {
  return `
    <div class="routine-menu">
      <span class="chip ${routine.template ? "controlled" : "stable"}">${label}</span>
      <button class="primary-action compact-action" data-start-routine="${routine.id}" type="button">Inicio</button>
      <button class="secondary-action compact-action" data-print-routine="${routine.id}" type="button">PDF</button>
      <details>
        <summary aria-label="Acciones de rutina"></summary>
        <div class="routine-menu-panel">
          <button data-edit-routine="${routine.id}" type="button">Editar</button>
          <button data-duplicate-routine="${routine.id}" type="button">Duplicar</button>
          <button class="danger-menu" data-delete-routine="${routine.id}" type="button">Eliminar</button>
        </div>
      </details>
    </div>
  `;
}

function historyMenu(item) {
  return `
    <div class="routine-menu">
      <span class="chip stable">${formatDuration(item.duration)}</span>
      <details>
        <summary aria-label="Acciones de historial"></summary>
        <div class="routine-menu-panel">
          <button data-edit-history="${item.id}" type="button">Editar</button>
          <button class="danger-menu" data-delete-history="${item.id}" type="button">Eliminar</button>
        </div>
      </details>
    </div>
  `;
}

function renderExerciseDraft() {
  $("#exercise-draft").innerHTML = exerciseDraft.map((exercise, index) => `
    <div class="draft-item ${editingExerciseIndex === index ? "editing" : ""}">
      <div class="draft-main">
        <strong>${escapeHtml(exercise.name)}</strong>
        <div class="meta-line">${formatExerciseDosage(exercise)}</div>
        ${exercise.category ? `<div class="meta-line">${escapeHtml(exercise.category)} &middot; ${escapeHtml(exercise.source || "Base de ejercicios")}</div>` : ""}
        <div class="button-row">
          <button class="secondary-action" data-edit-draft="${index}" type="button">Editar</button>
          <button class="danger-action" data-remove-draft="${index}" type="button">Quitar</button>
        </div>
      </div>
      <div class="draft-order" aria-label="Orden del ejercicio">
        <button class="order-button" data-move-draft="${index}:up" type="button" ${index === 0 ? "disabled" : ""} aria-label="Subir ejercicio">↑</button>
        <button class="order-button" data-move-draft="${index}:down" type="button" ${index === exerciseDraft.length - 1 ? "disabled" : ""} aria-label="Bajar ejercicio">↓</button>
      </div>
    </div>
  `).join("");
}

function moveDraftExercise(index, direction) {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= exerciseDraft.length) return;

  [exerciseDraft[index], exerciseDraft[nextIndex]] = [exerciseDraft[nextIndex], exerciseDraft[index]];
  if (editingExerciseIndex === index) {
    editingExerciseIndex = nextIndex;
  } else if (editingExerciseIndex === nextIndex) {
    editingExerciseIndex = index;
  }
  renderExerciseDraft();
}

function renderRoutines() {
  const query = $("#routine-search").value.trim().toLowerCase();
  const list = state.routines.filter((routine) => {
    const patient = getPatient(routine.patientId);
    return `${routine.name} ${routine.goal} ${patient?.name ?? ""}`.toLowerCase().includes(query);
  });

  $("#routines-list").innerHTML = list.map((routine) => {
    const patient = getPatient(routine.patientId);
    return `
      <article class="entity-card routine-card">
        <header class="routine-card-head">
          <div class="routine-card-title">
            <h3>${escapeHtml(getRoutineDisplayName(routine, patient))}</h3>
            <div class="meta-line">${routine.exercises.length} ejercicios</div>
          </div>
        </header>
        <div class="routine-card-actions">
          ${routineMenu(routine, routine.template ? "plantilla" : "activa")}
        </div>
        <div class="exercise-list">
          ${routine.exercises.map((exercise) => `
            <div class="exercise-row">
              <span>${escapeHtml(exercise.name)} <small>${exercise.sets}x${exercise.reps} &middot; ${escapeHtml(exercise.load)}</small></span>
              <span class="stat-pill">${exercise.progress || 0}%</span>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("") || "<div class='empty-state'>Sin rutinas. Asigna una rutina para comenzar.</div>";
}

function renderSessions() {
  const markup = state.activeSessions.map((session) => sessionCard(session)).join("");
  $("#active-sessions").innerHTML = markup || "<div class='empty-state'>No hay sesiones activas.</div>";
  $("#dashboard-active-sessions").className = state.activeSessions.length ? "session-list" : "session-list empty-state";
  $("#dashboard-active-sessions").innerHTML = markup || "No hay sesiones activas.";
}

function sessionCard(session) {
  const patient = getPatient(session.patientId);
  const routine = getRoutine(session.routineId);
  const completed = session.exercises.filter((exercise) => exercise.done).length;
  const abandoned = isSessionAbandoned(session);
  if (abandoned && session.status !== "possible_abandoned") {
    session.status = "possible_abandoned";
  }
  return `
    <article class="session-card ${abandoned ? "is-abandoned" : ""}">
      <header>
          <div>
            <h3>${escapeHtml(patient?.name ?? "Paciente")}</h3>
          <div class="meta-line">${escapeHtml(routine ? getRoutineDisplayName(routine, patient) : "Rutina")} &middot; ${completed}/${session.exercises.length} ejercicios</div>
        </div>
        <div class="session-status-stack">
          <span class="chip ${abandoned ? "high" : session.paused ? "controlled" : "stable"}">${abandoned ? "Posible abandonada" : session.paused ? "Pausada" : "Activa"}</span>
          <strong class="timer" data-session-timer="${session.id}">${formatDuration(elapsedSeconds(session))}</strong>
        </div>
      </header>
      <details class="session-exercises">
        <summary>
          <span>Ejercicios</span>
          <strong>${completed}/${session.exercises.length}</strong>
        </summary>
      <div class="exercise-list">
        ${session.exercises.map((exercise) => `
          <div class="exercise-row ${exercise.done ? "done" : ""}">
            <span>${escapeHtml(exercise.name)} <small>${exercise.sets}x${exercise.reps} &middot; ${escapeHtml(exercise.load)}</small></span>
            <button class="${exercise.done ? "secondary-action" : "primary-action"}" data-toggle-exercise="${session.id}:${exercise.id}" type="button">
              ${exercise.done ? "Hecho" : "Completar"}
            </button>
          </div>
        `).join("")}
      </div>
      </details>
      <div class="button-row">
        <button class="secondary-action" data-finish-session="${session.id}" type="button">Cerrar y registrar</button>
        ${abandoned ? `<button class="danger-action" data-close-abandoned-session="${session.id}" type="button">Finalizar abandonada</button>` : ""}
      </div>
    </article>
  `;
}

function renderHistory() {
  const query = $("#history-search").value.trim().toLowerCase();
  const list = getFilteredHistory().filter((item) => {
    const patient = getPatient(item.patientId);
    return (patient?.name ?? "").toLowerCase().includes(query);
  });

  $("#history-list").innerHTML = list.map((item) => {
    const patient = getPatient(item.patientId);
    const routine = getRoutine(item.routineId);
    return `
      <article class="entity-card">
        <header>
          <div>
            <h3>${escapeHtml(patient?.name ?? item.patientName)}</h3>
            <div class="meta-line">${formatDateTime(item.finishedAt)} &middot; ${escapeHtml(routine?.name ?? item.routineName)}</div>
          </div>
          ${historyMenu(item)}
        </header>
        <div class="stats-row">
          <span class="stat-pill">${item.completed}/${item.totalExercises} ejercicios</span>
          <span class="stat-pill">Volumen ${item.volume}</span>
          <span class="stat-pill">Progreso ${item.progress}%</span>
        </div>
        ${renderExecutionData(item)}
      </article>
    `;
  }).join("") || "<div class='empty-state'>Todavia no hay sesiones registradas.</div>";
  renderExerciseProgress();
}

function getFilteredHistory() {
  const range = $("#stats-range")?.value || "all";
  const now = Date.now();
  const days = { week: 7, month: 30, quarter: 90 }[range];
  if (!days) return state.history;
  const since = now - days * 24 * 60 * 60 * 1000;
  return state.history.filter((item) => new Date(item.finishedAt || item.createdAt).getTime() >= since);
}

function renderExecutionData(item) {
  if (!item.executionData?.length) return "";
  return `
    <details class="session-exercises execution-data">
      <summary>
        <span>Datos cargados</span>
        <strong>${item.executionData.filter((exercise) => exercise.done).length}/${item.executionData.length}</strong>
      </summary>
      <div class="exercise-list">
        ${item.executionData.map((exercise) => `
          <div class="exercise-row ${exercise.done ? "done" : ""}">
            <span>
              ${escapeHtml(exercise.name)}
              <small>
                Series ${escapeHtml(exercise.series || "-")} &middot;
                Reps ${escapeHtml(exercise.reps || "-")} &middot;
                Kg ${escapeHtml(loadToInputValue(exercise.load || "") || "-")} &middot;
                Seg ${escapeHtml(exercise.seconds || "-")}
                ${exercise.notes ? ` &middot; ${escapeHtml(exercise.notes)}` : ""}
              </small>
            </span>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

function renderClinicalMetrics() {
  const history = getFilteredHistory();
  const completedExercises = history.reduce((sum, item) => sum + (item.completedCount ?? item.completed ?? 0), 0);
  const totalExercises = history.reduce((sum, item) => sum + (item.totalCount ?? item.totalExercises ?? 0), 0);
  const totalVolume = history.reduce((sum, item) => sum + Number(item.volume || 0), 0);
  const totalDuration = history.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const completion = totalExercises ? Math.round((completedExercises / totalExercises) * 100) : 0;
  const avgDuration = history.length ? Math.round(totalDuration / history.length) : 0;
  const patientCounts = history.reduce((counts, item) => {
    counts[item.patientId] = (counts[item.patientId] || 0) + 1;
    return counts;
  }, {});
  const topPatientId = Object.entries(patientCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topPatient = getPatient(topPatientId)?.name || "-";
  const activePatients = state.patients.filter((patient) => getPatientStats(patient.id).routines.length > 0).length;
  const inactivePatients = state.patients.filter((patient) => {
    const last = getPatientStats(patient.id).sessions[0];
    if (!last) return true;
    return Date.now() - new Date(last.finishedAt).getTime() > 30 * 24 * 60 * 60 * 1000;
  }).length;
  const exerciseCounts = history.flatMap((item) => item.executionData || []).reduce((counts, exercise) => {
    if (exercise.done) counts[exercise.name] = (counts[exercise.name] || 0) + 1;
    return counts;
  }, {});
  const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  $("#metric-completion").textContent = `${completion}%`;
  $("#metric-avg-time").textContent = formatDuration(avgDuration);
  $("#metric-volume").textContent = totalVolume;
  $("#metric-top-patient").textContent = topPatient;
  $("#metric-insights").innerHTML = `
    <article><strong>${state.routines.length}</strong><span>rutinas creadas</span></article>
    <article><strong>${activePatients}</strong><span>pacientes con rutina</span></article>
    <article><strong>${state.activeSessions.length}</strong><span>sesiones activas ahora</span></article>
    <article><strong>${history.length}</strong><span>sesiones filtradas</span></article>
    <article><strong>${escapeHtml(topExercise)}</strong><span>ejercicio mas realizado</span></article>
    <article><strong>${inactivePatients}</strong><span>pacientes inactivos</span></article>
  `;
}

function renderExerciseProgress() {
  const patientId = $("#progress-patient")?.value || "";
  const exerciseName = $("#progress-exercise")?.value || "";
  const patientSelect = $("#progress-patient");
  const exerciseSelect = $("#progress-exercise");
  const table = $("#exercise-progress-table");
  if (!patientSelect || !exerciseSelect || !table) return;

  patientSelect.innerHTML = ["<option value=''>Todos los pacientes</option>", ...state.patients.map((patient) => `<option value="${patient.id}">${escapeHtml(patient.name)}</option>`)].join("");
  patientSelect.value = state.patients.some((patient) => patient.id === patientId) ? patientId : "";

  const history = getFilteredHistory().filter((item) => !patientSelect.value || item.patientId === patientSelect.value);
  const names = [...new Set(history.flatMap((item) => (item.executionData || []).map((exercise) => exercise.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  exerciseSelect.innerHTML = ["<option value=''>Todos los ejercicios</option>", ...names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)].join("");
  exerciseSelect.value = names.includes(exerciseName) ? exerciseName : "";

  const rows = history.flatMap((item) => (item.executionData || [])
    .filter((exercise) => !exerciseSelect.value || exercise.name === exerciseSelect.value)
    .map((exercise) => ({ item, exercise })));

  if (!rows.length) {
    table.innerHTML = "<div class='empty-state'>Todavia no hay progreso historico para ese filtro.</div>";
    return;
  }

  const renderProgressRows = (items) => items.map(({ item, exercise }) => {
    const patient = getPatient(item.patientId);
    const volume = getExerciseNumericValue(exercise.series, 0) * getExerciseNumericValue(exercise.reps, 0) * getExerciseNumericValue(exercise.load, 1);
    return `<tr><td>${formatDateTime(item.finishedAt).split(",")[0]}</td><td>${escapeHtml(patient?.name || item.patientName || "-")}</td><td>${escapeHtml(exercise.name)}</td><td>${escapeHtml(exercise.series || "-")}</td><td>${escapeHtml(exercise.reps || "-")}</td><td>${escapeHtml(exercise.load || "-")}</td><td>${Math.round(volume)}</td></tr>`;
  }).join("");

  const renderProgressTable = (items) => `
    <table class="progress-table">
      <thead><tr><th>Fecha</th><th>Paciente</th><th>Ejercicio</th><th>Series</th><th>Reps</th><th>Kg</th><th>Volumen</th></tr></thead>
      <tbody>${renderProgressRows(items)}</tbody>
    </table>
  `;

  if (exerciseSelect.value) {
    table.innerHTML = renderProgressTable(rows.slice(0, 80));
    return;
  }

  const groups = rows.reduce((acc, row) => {
    const dateSource = row.item.finishedAt || row.item.createdAt || new Date().toISOString();
    const dateKey = new Date(dateSource).toISOString().slice(0, 10);
    const key = `${row.item.patientId || row.item.patientName || "paciente"}:${dateKey}`;
    if (!acc[key]) {
      const patient = getPatient(row.item.patientId);
      acc[key] = {
        date: formatDateTime(dateSource).split(",")[0],
        patientName: patient?.name || row.item.patientName || "-",
        sessions: new Set(),
        rows: [],
        volume: 0
      };
    }
    const exercise = row.exercise;
    acc[key].sessions.add(row.item.id);
    acc[key].rows.push(row);
    acc[key].volume += getExerciseNumericValue(exercise.series, 0) * getExerciseNumericValue(exercise.reps, 0) * getExerciseNumericValue(exercise.load, 1);
    return acc;
  }, {});

  table.innerHTML = `
    <div class="progress-pack-list">
      ${Object.values(groups).map((group) => `
        <details class="progress-pack">
          <summary>
            <span>
              <strong>${escapeHtml(group.date)}</strong>
              <small>${escapeHtml(group.patientName)}</small>
            </span>
            <span class="stat-pill">${group.rows.length} ejercicios</span>
            <span class="stat-pill">${group.sessions.size} sesiones</span>
            <span class="stat-pill">Volumen ${Math.round(group.volume)}</span>
          </summary>
          <div class="progress-pack-table">
            ${renderProgressTable(group.rows)}
          </div>
        </details>
      `).join("")}
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  renderClinicalMetrics();
  renderPatientOptions();
  renderPatients();
  renderAthleteAccessAdmin();
  renderExerciseLibrary();
  renderCustomExerciseLibrary();
  renderExerciseDraft();
  renderRoutines();
  renderSessions();
  renderHistory();
  if (selectedPatientId) {
    renderPatientProfile();
  }
  renderAccessShell();
}

function addPatient(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const dni = normalizeDni(form.get("dni"));
  if (!dni) {
    window.alert("El DNI es obligatorio para crear la ficha.");
    return;
  }
  if (hasDuplicateDni(dni)) {
    window.alert("Ya existe un paciente con ese DNI. No se permiten duplicados.");
    return;
  }
  state.patients.unshift({
    id: uid("patient"),
    name: form.get("name").trim(),
    age: Number(form.get("age")),
    dni,
    phone: form.get("phone").trim(),
    email: form.get("email").trim(),
    phase: form.get("phase"),
    history: form.get("history").trim(),
    historyPrivate: form.get("history").trim(),
    notes: form.get("notes").trim(),
    visibleNotes: String(form.get("visibleNotes") || "").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  event.currentTarget.reset();
  event.currentTarget.closest(".collapsible-panel")?.removeAttribute("open");
  persist();
  renderAll();
}

function addExerciseDraft() {
  const name = $("#exercise-name").value.trim();
  const sets = Number($("#exercise-sets").value);
  const reps = Number($("#exercise-reps").value);
  const seconds = Number($("#exercise-seconds").value);
  const load = formatKgLoad($("#exercise-load").value);
  if (!name || !sets || (!reps && !seconds)) return;
  const libraryExercise = findLibraryExerciseByName(name);

  const nextExercise = {
    id: editingExerciseIndex === null ? uid("ex") : exerciseDraft[editingExerciseIndex].id,
    name,
    category: libraryExercise?.category || $("#exercise-name").dataset.libraryCategory || "",
    source: libraryExercise?.source || $("#exercise-name").dataset.librarySource || "",
    sets,
    reps: seconds ? "" : reps,
    seconds: seconds || "",
    load,
    prescription: buildPrescription(sets, seconds ? "" : reps, seconds, load),
    progress: exerciseDraft[editingExerciseIndex]?.progress || 0
  };

  if (editingExerciseIndex === null) {
    exerciseDraft.push(nextExercise);
  } else {
    exerciseDraft[editingExerciseIndex] = nextExercise;
  }

  editingExerciseIndex = null;
  $("#exercise-name").value = "";
  $("#exercise-sets").value = "";
  $("#exercise-reps").value = "";
  $("#exercise-seconds").value = "";
  $("#exercise-load").value = "";
  $("#exercise-name").dataset.libraryCategory = "";
  $("#exercise-name").dataset.librarySource = "";
  renderExerciseDraft();
}

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function setVoiceRoutineStatus(message, type = "") {
  const node = $("#voice-routine-status");
  if (!node) return;
  node.textContent = message;
  node.dataset.type = type;
}

function spanishNumberToValue(value) {
  const clean = String(value || "").trim().toLowerCase().replace(",", ".");
  if (!clean) return null;
  const direct = Number(clean);
  if (Number.isFinite(direct)) return direct;
  const words = {
    un: 1,
    una: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    veinte: 20,
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60
  };
  return words[clean] ?? null;
}

function parseRoutineVoiceText(text) {
  const numberPattern = "\\d+(?:[,.]\\d+)?|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|cuarenta|cincuenta|sesenta";
  const segments = String(text || "")
    .replace(/\by luego\b/gi, ".")
    .replace(/\bdespues\b/gi, ".")
    .replace(/\bdespués\b/gi, ".")
    .split(/[\n.;]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.map((segment) => {
    const source = segment.replace(/\s+/g, " ");
    const setsMatch = source.match(new RegExp(`\\b(${numberPattern})\\s*(?:series?|serie)\\b`, "i"));
    const repsMatch = source.match(new RegExp(`\\b(${numberPattern})\\s*(?:repeticiones?|reps?)\\b`, "i"));
    const secondsMatch = source.match(new RegExp(`\\b(${numberPattern})\\s*(?:segundos?|seg)\\b`, "i"));
    const loadMatch = source.match(new RegExp(`\\b(${numberPattern})\\s*(?:kilos?|kg)\\b`, "i"));
    const sets = spanishNumberToValue(setsMatch?.[1]) || 1;
    const reps = spanishNumberToValue(repsMatch?.[1]) || "";
    const seconds = spanishNumberToValue(secondsMatch?.[1]) || "";
    const loadValue = spanishNumberToValue(loadMatch?.[1]);
    const name = source
      .replace(new RegExp(`\\b(${numberPattern})\\s*(?:series?|serie|repeticiones?|reps?|segundos?|seg|kilos?|kg)\\b`, "gi"), "")
      .replace(/\b(agregar|sumar|cargar|hacer|ejercicio|con|de)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!name || (!reps && !seconds)) return null;
    const libraryExercise = findLibraryExerciseByName(name);
    const load = loadValue ? formatKgLoad(loadValue) : "Sin carga";
    return {
      id: uid("ex"),
      name,
      category: libraryExercise?.category || "",
      source: libraryExercise?.source || "Dictado por voz",
      sets,
      reps: seconds ? "" : reps,
      seconds: seconds || "",
      load,
      prescription: buildPrescription(sets, seconds ? "" : reps, seconds, load),
      progress: 0
    };
  }).filter(Boolean);
}

function applyVoiceRoutineText() {
  const input = $("#voice-routine-text");
  if (!input) return;
  const exercises = parseRoutineVoiceText(input.value);
  if (!exercises.length) {
    setVoiceRoutineStatus("No pude detectar ejercicios completos. Probá: Sentadilla 3 series 12 repeticiones 10 kilos.", "warn");
    return;
  }
  exerciseDraft.push(...exercises);
  editingExerciseIndex = null;
  renderExerciseDraft();
  setVoiceRoutineStatus(`${exercises.length} ejercicio${exercises.length === 1 ? "" : "s"} agregado${exercises.length === 1 ? "" : "s"} al borrador. Revisalos antes de guardar.`, "ok");
}

function toggleRoutineVoiceRecognition() {
  const Recognition = getSpeechRecognitionConstructor();
  const button = $("#voice-routine-toggle");
  const input = $("#voice-routine-text");
  if (!Recognition || !button || !input) {
    setVoiceRoutineStatus("Tu navegador no permite dictado por voz en esta pantalla. Podés pegar el texto y agregarlo igual.", "warn");
    return;
  }

  if (routineSpeechIsListening && routineSpeechRecognition) {
    routineSpeechRecognition.stop();
    return;
  }

  routineSpeechRecognition = new Recognition();
  routineSpeechRecognition.lang = "es-AR";
  routineSpeechRecognition.continuous = true;
  routineSpeechRecognition.interimResults = true;
  routineSpeechIsListening = true;
  button.classList.add("listening");
  button.textContent = "Escuchando";
  setVoiceRoutineStatus("Escuchando... dictá cada ejercicio con series, reps o segundos y carga si corresponde.", "live");

  let finalTranscript = input.value.trim();
  routineSpeechRecognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (event.results[index].isFinal) finalTranscript = `${finalTranscript} ${transcript}.`.trim();
      else interim = `${interim} ${transcript}`.trim();
    }
    input.value = `${finalTranscript}${interim ? ` ${interim}` : ""}`.trim();
  };

  routineSpeechRecognition.onerror = () => {
    setVoiceRoutineStatus("No pude acceder al micrófono o el dictado se interrumpió. Revisá permisos del navegador.", "warn");
  };

  routineSpeechRecognition.onend = () => {
    routineSpeechIsListening = false;
    button.classList.remove("listening");
    button.textContent = "Dictar";
    if (input.value.trim()) {
      setVoiceRoutineStatus("Dictado listo. Revisá el texto y tocá Agregar dictado.", "ok");
    }
  };

  routineSpeechRecognition.start();
}

function editDraftExercise(index) {
  const exercise = exerciseDraft[index];
  if (!exercise) return;
  const dosage = splitExercisePrescription(exercise);
  editingExerciseIndex = index;
  $("#exercise-name").value = exercise.name || "";
  $("#exercise-sets").value = dosage.series === "-" ? "" : dosage.series;
  $("#exercise-reps").value = dosage.reps === "-" ? "" : dosage.reps;
  $("#exercise-seconds").value = dosage.seconds === "-" ? "" : dosage.seconds;
  $("#exercise-load").value = dosage.load === "-" ? "" : loadToInputValue(dosage.load);
  $("#exercise-name").dataset.libraryCategory = exercise.category || "";
  $("#exercise-name").dataset.librarySource = exercise.source || "";
  renderExerciseDraft();
}

function addRoutine(event) {
  event.preventDefault();
  if (editingExerciseIndex !== null || $("#exercise-name").value.trim()) {
    addExerciseDraft();
  }
  if (!exerciseDraft.length) return;

  const form = new FormData(event.currentTarget);
  if (editingRoutineId && !window.confirm("Sobrescribir esta rutina con los cambios actuales?")) return;
  const nextRoutine = {
    id: editingRoutineId || uid("routine"),
    patientId: form.get("patientId"),
    name: form.get("name").trim(),
    goal: form.get("goal").trim(),
    obs: form.get("goal").trim(),
    type: form.get("template") === "on" ? "template" : "assigned",
    date: new Date().toISOString(),
    template: form.get("template") === "on",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: exerciseDraft.map((exercise) => ({ ...exercise }))
  };

  if (editingRoutineId) {
    const index = state.routines.findIndex((routine) => routine.id === editingRoutineId);
    if (index !== -1) {
      nextRoutine.createdAt = state.routines[index].createdAt;
      state.routines[index] = nextRoutine;
    }
  } else {
    state.routines.unshift(nextRoutine);
  }

  editingRoutineId = null;
  exerciseDraft = [];
  event.currentTarget.reset();
  persist();
  renderAll();
}

function editRoutine(routineId) {
  const routine = getRoutine(routineId);
  if (!routine) return;

  editingRoutineId = routine.id;
  const form = $("#routine-form");
  form.elements.name.value = routine.name || "";
  form.elements.patientId.value = routine.patientId || "";
  form.elements.goal.value = routine.goal || "";
  form.elements.template.checked = Boolean(routine.template);
  exerciseDraft = routine.exercises.map((exercise) => {
    const dosage = splitExercisePrescription(exercise);
    return {
      ...exercise,
      sets: dosage.series === "-" ? "" : Number(dosage.series),
      reps: dosage.reps === "-" ? "" : Number(dosage.reps),
      seconds: dosage.seconds === "-" ? "" : Number(dosage.seconds),
      load: dosage.load === "-" ? "" : dosage.load
    };
  });
  closePatientProfile();
  switchView("routines");
  renderExerciseDraft();
}

function deleteRoutine(routineId) {
  const routine = getRoutine(routineId);
  if (!routine) return;
  if (!window.confirm(`Eliminar la rutina "${routine.name}"? Esta accion no se puede deshacer.`)) return;

  state.routines = state.routines.filter((item) => item.id !== routineId);
  state.activeSessions = state.activeSessions.filter((session) => session.routineId !== routineId);
  deleteCloudEntity("routines", routineId);
  if (editingRoutineId === routineId) {
    editingRoutineId = null;
    exerciseDraft = [];
    $("#routine-form").reset();
  }
  persist();
  renderAll();
}

function getActiveSessionForPatient(patientId) {
  return state.activeSessions.find((session) => session.patientId === patientId);
}

function resolveActiveSessionConflict(patientId) {
  const existing = getActiveSessionForPatient(patientId);
  if (!existing) return "start";
  const response = window.prompt(
    "Este deportista ya tiene una sesion en curso. Escriba: continuar, finalizar o cancelar.",
    "continuar"
  );
  const action = String(response || "cancelar").trim().toLowerCase();
  if (action.startsWith("cont")) {
    if (currentSession.role === "admin") switchView("sessions");
    renderAll();
    return "cancel";
  }
  if (action.startsWith("fin")) {
    finishSession(existing.id, { abandoned: true });
    return "start";
  }
  return "cancel";
}

function startSession(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const routine = getRoutine(form.get("routineId"));
  if (!routine) return;
  if (resolveActiveSessionConflict(form.get("patientId")) === "cancel") return;

  state.activeSessions.unshift({
    id: uid("session"),
    source: "admin",
    patientId: form.get("patientId"),
    routineId: routine.id,
    routineName: routine.name,
    startedAt: new Date().toISOString(),
    status: "active",
    paused: false,
    pausedMs: 0,
    progress: 0,
    updatedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise) => ({ ...exercise, done: false }))
  });
  persist();
  renderAll();
}

function startRoutineSession(routineId) {
  const routine = getRoutine(routineId);
  if (!routine) return;
  if (resolveActiveSessionConflict(routine.patientId) === "cancel") return;

  state.activeSessions.unshift({
    id: uid("session"),
    source: "admin",
    patientId: routine.patientId,
    routineId: routine.id,
    routineName: routine.name,
    startedAt: new Date().toISOString(),
    status: "active",
    paused: false,
    pausedMs: 0,
    progress: 0,
    updatedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise) => ({ ...exercise, done: false }))
  });
  persist();
  renderAll();
  switchView("sessions");
}

function duplicateRoutine(routineId) {
  const routine = getRoutine(routineId);
  if (!routine) return;

  state.routines.unshift({
    ...routine,
    id: uid("routine"),
    name: `${routine.name} copia`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise) => ({ ...exercise, id: uid("ex") }))
  });
  persist();
  renderAll();
}

function buildRoutinePrint(routineId) {
  const routine = getRoutine(routineId);
  if (!routine) return "";
  const patient = getPatient(routine.patientId);
  const dateSource = routine.date || routine.createdAt || new Date().toISOString();
  const date = new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateSource));
  const generatedAt = new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
  const athleteName = patient?.name || "Deportista";
  const objective = routine.goal || routine.obs || routine.name || "Rutina de entrenamiento";
  const day = routine.day || routine.sessionDay || "1";
  const observations = routine.notes || routine.observations || routine.obs || routine.goal || patient?.notes || "Sin observaciones.";

  return `
    <section class="print-sheet routine-print-sheet print-page">
      <header class="routine-print-hero">
        <div class="routine-print-hero-content">
          <div class="routine-print-logo">KINE<span>PRO</span></div>
          <p>Plan de entrenamiento</p>
          <h1>${escapeHtml(athleteName)}</h1>
          <i aria-hidden="true"></i>
        </div>
      </header>

      <section class="routine-print-meta" aria-label="Datos principales de la rutina">
        <article><span>Nombre</span><strong>${escapeHtml(athleteName)}</strong></article>
        <article><span>Objetivo</span><strong>${escapeHtml(objective)}</strong></article>
        <article><span>Fecha</span><strong>${escapeHtml(date)}</strong></article>
        <article><span>Dia</span><strong>${escapeHtml(day)}</strong></article>
        <article><span>Ejercicios</span><strong>${routine.exercises.length}</strong></article>
      </section>

      <div class="routine-print-day"><span></span><strong>DIA</strong><b>${escapeHtml(day)}</b></div>

      <section class="routine-print-table-card">
        <table class="print-table routine-print-table">
          <colgroup>
            <col class="exercise-col">
            <col>
            <col>
            <col>
            <col>
          </colgroup>
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Series</th>
              <th>Repeticiones</th>
              <th>Segundos</th>
              <th>Carga</th>
            </tr>
          </thead>
          <tbody>
            ${routine.exercises.map(printExerciseRow).join("")}
          </tbody>
        </table>
      </section>

      <section class="routine-print-note">
        <div class="routine-print-note-icon" aria-hidden="true">K</div>
        <div>
          <strong>Observaciones</strong>
          <p>${escapeHtml(observations || "Sin observaciones.")}</p>
        </div>
      </section>

      <footer class="routine-print-footer">
        <span></span>
        <strong>K</strong>
        <span></span>
        <p>KINEPRO | Gestion de entrenamiento y rendimiento | Generado ${escapeHtml(generatedAt)}</p>
      </footer>
    </section>
  `;
}

function printExerciseRow(exercise) {
  const prescription = splitExercisePrescription(exercise);
  return `
    <tr>
      <td>${escapeHtml(exercise.name)}</td>
      <td>${escapeHtml(prescription.series)}</td>
      <td>${escapeHtml(prescription.reps)}</td>
      <td>${escapeHtml(prescription.seconds)}</td>
      <td>${escapeHtml(prescription.load)}</td>
    </tr>
  `;
}

function buildPatientPrint(patientId) {
  const patient = getPatient(patientId);
  if (!patient) return "";
  const stats = getPatientStats(patient.id);

  return `
    <section class="print-sheet">
      <header>
        <div class="print-logo">KINE<span>PRO</span></div>
        <div class="print-title">
          <strong>${escapeHtml(patient.name)}</strong>
          <div class="print-meta">
            <div>Fase: ${escapeHtml(patient.phase || "-")}</div>
            <div>DNI: ${escapeHtml(patient.dni || "-")}</div>
            <div>Telefono: ${escapeHtml(patient.phone || "-")}</div>
            <div>Email: ${escapeHtml(patient.email || "-")}</div>
          </div>
        </div>
      </header>
      <div class="print-day">FICHA <span>${escapeHtml(getInitials(patient.name))}</span></div>
      <table class="print-table">
        <tbody>
          <tr><th>Edad</th><td>${escapeHtml(patient.age || "-")}</td></tr>
          <tr><th>Rutinas activas</th><td>${stats.routines.length}</td></tr>
          <tr><th>Sesiones registradas</th><td>${stats.sessions.length}</td></tr>
        </tbody>
      </table>
      <div class="print-note">
        <strong>Antecedentes:</strong>
        <span>${escapeHtml(patient.history || "Sin antecedentes.")}</span>
      </div>
      <div class="print-note">
        <strong>Observaciones:</strong>
        <span>${escapeHtml(patient.notes || "Sin observaciones.")}</span>
      </div>
    </section>
  `;
}

function printDocument(markup) {
  if (!markup) return;
  $("#print-area").innerHTML = markup;
  document.body.classList.add("printing");
  window.print();
}

function toggleExercise(sessionId, exerciseId) {
  const session = state.activeSessions.find((item) => item.id === sessionId);
  const exercise = session?.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;
  exercise.done = !exercise.done;
  const completed = session.exercises.filter((item) => item.done).length;
  session.progress = Math.round((completed / Math.max(1, session.exercises.length)) * 100);
  touchEntity(session);
  persist();
  renderAll();
}

async function finishSession(sessionId, options = {}) {
  const index = state.activeSessions.findIndex((item) => item.id === sessionId);
  if (index === -1) return;
  const session = state.activeSessions[index];
  const message = options.abandoned
    ? "Cerrar esta sesion activa marcada como posible abandonada?"
    : "Finalizar la sesion y guardar el registro en historial?";
  if (!options.skipConfirm && !window.confirm(message)) return;

  const record = buildSessionHistoryRecord(session);
  if (options.abandoned) {
    record.status = "abandoned";
    record.notes = "Sesion cerrada manualmente por posible abandono.";
  }
  state.history.unshift(record);
  state.activeSessions.splice(index, 1);

  await persist();
  deleteCloudEntity("activeSessions", session.id);
  renderAll();
}

function buildSessionHistoryRecord(session) {
  const patient = getPatient(session.patientId);
  const routine = getRoutine(session.routineId);
  const completed = session.exercises.filter((exercise) => exercise.done).length;
  const volume = session.exercises.reduce((sum, exercise) => {
    const sets = getExerciseNumericValue(exercise.actualSets, Number(exercise.sets || 0));
    const reps = getExerciseNumericValue(exercise.actualReps, Number(exercise.reps || 1));
    const load = getExerciseNumericValue(exercise.actualLoad || exercise.load, 1);
    return sum + sets * reps * load;
  }, 0);

  return {
    id: uid("history"),
    source: session.source || "admin",
    patientId: session.patientId,
    patientName: patient?.name ?? "Paciente",
    routineId: session.routineId,
    routineName: routine?.name ?? "Rutina",
    startedAt: session.startedAt,
    finishedAt: new Date().toISOString(),
    duration: elapsedSeconds(session),
    completed,
    completedCount: completed,
    totalExercises: session.exercises.length,
    totalCount: session.exercises.length,
    volume: Math.round(volume),
    progress: Math.round((completed / Math.max(1, session.exercises.length)) * 100),
    status: session.status || "finalized",
    notes: "",
    createdAt: new Date().toISOString(),
    executionData: session.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      done: Boolean(exercise.done),
      series: String(exercise.actualSets || exercise.sets || ""),
      reps: String(exercise.actualReps || exercise.reps || ""),
      load: formatKgLoad(exercise.actualLoad || exercise.load || ""),
      seconds: String(exercise.actualSeconds || exercise.seconds || ""),
      notes: exercise.athleteNotes || ""
    }))
  };
}

function startAthleteRoutine(routineId) {
  const patient = getAthletePatient();
  const routine = getRoutine(routineId);
  if (!patient || !routine || routine.patientId !== patient.id) return;

  const existing = getActiveSessionForPatient(patient.id);

  if (existing) {
    window.alert("Tenes una sesion en curso. Podes continuarla desde el banner superior.");
    renderAthletePortal();
    return;
  }

  state.activeSessions.unshift({
    id: uid("athlete-session"),
    source: "athlete",
    patientId: patient.id,
    routineId: routine.id,
    routineName: routine.name,
    startedAt: new Date().toISOString(),
    status: "active",
    paused: false,
    pauseStartedAt: "",
    pausedMs: 0,
    progress: 0,
    updatedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise) => ({
      ...exercise,
      done: false,
      actualSets: "",
      actualReps: "",
      actualLoad: "",
      actualSeconds: "",
      athleteNotes: ""
    }))
  });

  persist();
  renderAll();
}

function toggleAthleteExercise(sessionId, exerciseId) {
  const session = state.activeSessions.find((item) => item.id === sessionId);
  const exercise = session?.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;
  exercise.done = !exercise.done;
  const completed = session.exercises.filter((item) => item.done).length;
  session.progress = Math.round((completed / Math.max(1, session.exercises.length)) * 100);
  touchEntity(session);
  persist();
  renderAll();
}

function updateAthleteExerciseData(sessionId, exerciseId, field, value) {
  const allowedFields = ["actualSets", "actualReps", "actualLoad", "actualSeconds", "athleteNotes"];
  if (!allowedFields.includes(field)) return;
  const session = state.activeSessions.find((item) => item.id === sessionId);
  const exercise = session?.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;
  exercise[field] = field === "actualLoad" ? loadToInputValue(value) : String(value || "").trim();
  touchEntity(session);
  persist();
}

function toggleAthletePause(sessionId) {
  const session = state.activeSessions.find((item) => item.id === sessionId);
  if (!session) return;

  if (session.paused) {
    const pauseStarted = new Date(session.pauseStartedAt || new Date()).getTime();
    session.pausedMs = Number(session.pausedMs || 0) + Math.max(0, Date.now() - pauseStarted);
    session.paused = false;
    session.pauseStartedAt = "";
  } else {
    session.paused = true;
    session.pauseStartedAt = new Date().toISOString();
  }

  touchEntity(session);
  persist();
  renderAll();
}

function finishAthleteSession(sessionId) {
  const session = state.activeSessions.find((item) => item.id === sessionId);
  if (!session) return;
  if (!window.confirm("Finalizar la rutina y guardar tu sesion?")) return;
  finishSession(sessionId, { skipConfirm: true });
}

function parseDurationInput(value, fallback) {
  const clean = String(value || "").trim();
  if (!clean) return fallback;
  const parts = clean.split(":").map((part) => Number(part));

  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return Math.max(0, (parts[0] * 3600) + (parts[1] * 60) + parts[2]);
  }

  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return Math.max(0, (parts[0] * 60) + parts[1]);
  }

  const minutes = Number(clean.replace(",", "."));
  return Number.isFinite(minutes) ? Math.max(0, Math.round(minutes * 60)) : fallback;
}

function promptNumber(label, currentValue) {
  const value = window.prompt(label, currentValue);
  if (value === null) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : currentValue;
}

function editHistoryRecord(historyId) {
  const item = state.history.find((record) => record.id === historyId);
  if (!item) return;

  const routineName = window.prompt("Nombre de rutina en historial", item.routineName || getRoutine(item.routineId)?.name || "Rutina");
  if (routineName === null) return;

  const durationInput = window.prompt("Tiempo de sesion (mm:ss o minutos)", formatDuration(item.duration));
  if (durationInput === null) return;

  const completed = promptNumber("Ejercicios completados", item.completed);
  if (completed === null) return;

  const totalExercises = promptNumber("Total de ejercicios", item.totalExercises);
  if (totalExercises === null) return;

  const volume = promptNumber("Volumen total", item.volume);
  if (volume === null) return;

  const progressFallback = totalExercises ? Math.round((completed / Math.max(1, totalExercises)) * 100) : item.progress;
  const progress = promptNumber("Progreso funcional (%)", progressFallback);
  if (progress === null) return;

  item.routineName = routineName.trim() || item.routineName;
  item.duration = parseDurationInput(durationInput, item.duration);
  item.completed = Math.max(0, Math.round(completed));
  item.totalExercises = Math.max(1, Math.round(totalExercises));
  item.volume = Math.max(0, Math.round(volume));
  item.progress = Math.max(0, Math.min(100, Math.round(progress)));

  persist();
  renderAll();
}

function deleteHistoryRecord(historyId) {
  const item = state.history.find((record) => record.id === historyId);
  if (!item) return;
  if (!window.confirm("Eliminar esta sesion del historial?")) return;

  state.history = state.history.filter((record) => record.id !== historyId);
  deleteCloudEntity("history", historyId);
  persist();
  renderAll();
}

async function savePatientProfile(event) {
  event.preventDefault();
  const patient = getPatient(selectedPatientId);
  if (!patient) return;

  const form = new FormData(event.currentTarget);
  const dni = normalizeDni(form.get("dni"));
  if (!dni) {
    window.alert("El DNI es obligatorio.");
    return;
  }
  if (hasDuplicateDni(dni, patient.id)) {
    window.alert("Ya existe otro paciente con ese DNI. No se permiten duplicados.");
    return;
  }
  patient.name = form.get("name").trim();
  patient.age = Number(form.get("age"));
  patient.dni = dni;
  patient.phone = form.get("phone").trim();
  patient.email = form.get("email").trim();
  patient.phase = form.get("phase").trim();
  patient.history = form.get("history").trim();
  patient.historyPrivate = patient.history;
  patient.notes = form.get("notes").trim();
  patient.visibleNotes = String(form.get("visibleNotes") || "").trim();
  touchEntity(patient);
  const access = getAthleteAccessByPatient(patient.id);
  if (access) {
    access.dni = dni;
    touchEntity(access);
  }
  persist();
  renderAll();
}

function deleteSelectedPatient() {
  const patient = getPatient(selectedPatientId);
  if (!patient) return;
  if (!window.confirm(`Eliminar el perfil de ${patient.name}? Tambien se eliminaran sus rutinas y sesiones activas.`)) return;

  state.patients = state.patients.filter((item) => item.id !== patient.id);
  const removedAthletes = state.athletes.filter((athlete) => athlete.patientId === patient.id);
  const removedRoutines = state.routines.filter((routine) => routine.patientId === patient.id);
  const removedSessions = state.activeSessions.filter((session) => session.patientId === patient.id);
  const removedHistory = state.history.filter((session) => session.patientId === patient.id);
  state.athletes = state.athletes.filter((athlete) => athlete.patientId !== patient.id);
  state.routines = state.routines.filter((routine) => routine.patientId !== patient.id);
  state.activeSessions = state.activeSessions.filter((session) => session.patientId !== patient.id);
  state.history = state.history.filter((session) => session.patientId !== patient.id);
  deleteCloudEntity("patients", patient.id);
  removedAthletes.forEach((item) => deleteCloudEntity("athletes", item.id));
  removedRoutines.forEach((item) => deleteCloudEntity("routines", item.id));
  removedSessions.forEach((item) => deleteCloudEntity("activeSessions", item.id));
  removedHistory.forEach((item) => deleteCloudEntity("history", item.id));
  closePatientProfile();
  persist();
  renderAll();
}

function bindEvents() {
  $("#admin-reveal").addEventListener("click", () => {
    const form = $("#admin-login-form");
    form.hidden = !form.hidden;
    if (!form.hidden) {
      $("#admin-password").focus();
    }
  });
  $("#admin-login-form").addEventListener("submit", adminLogin);
  $("#athlete-login-form").addEventListener("submit", athleteLogin);
  $("#session-logout").addEventListener("click", logout);
  $("#athlete-logout").addEventListener("click", logout);
  $("#create-athlete-access").addEventListener("click", () => createAthleteAccess($("#athlete-patient-select").value));

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-view-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.viewJump);
      if (button.dataset.viewJump === "patients") {
        document.querySelector(".collapsible-panel")?.setAttribute("open", "");
      }
    });
  });

  $("#patient-form").addEventListener("submit", addPatient);
  $("#routine-form").addEventListener("submit", addRoutine);
  $("#session-form").addEventListener("submit", startSession);
  $("#profile-form").addEventListener("submit", savePatientProfile);
  $("#custom-exercise-form")?.addEventListener("submit", addCustomExercise);
  $("#add-exercise").addEventListener("click", addExerciseDraft);
  $("#use-library-exercise").addEventListener("click", useLibraryExercise);
  $("#voice-routine-toggle")?.addEventListener("click", toggleRoutineVoiceRecognition);
  $("#voice-routine-apply")?.addEventListener("click", applyVoiceRoutineText);
  $("#voice-routine-clear")?.addEventListener("click", () => {
    $("#voice-routine-text").value = "";
    setVoiceRoutineStatus("Podés dictar o pegar una rutina y revisar antes de agregar.");
  });
  if (!getSpeechRecognitionConstructor()) {
    $("#voice-routine-toggle")?.setAttribute("disabled", "");
    setVoiceRoutineStatus("Dictado no disponible en este navegador. Podés pegar el texto y agregarlo igual.", "warn");
  }
  $("#exercise-category-filter").addEventListener("change", renderExerciseLibrary);
  $("#exercise-library-search").addEventListener("input", renderExerciseLibrary);
  $("#session-patient").addEventListener("change", renderSessionRoutineOptions);
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing");
    $("#print-area").innerHTML = "";
  });
  window.addEventListener("online", () => {
    markSyncing();
    writeCloudState();
  });
  window.addEventListener("offline", () => markCloudError("Sin conexion"));

  ["#patient-search", "#routine-search", "#history-search", "#stats-range", "#progress-patient", "#progress-exercise"].forEach((selector) => {
    $(selector)?.addEventListener("input", renderAll);
    $(selector)?.addEventListener("change", renderAll);
  });

  document.body.addEventListener("click", (event) => {
    const draftButton = event.target.closest("[data-remove-draft]");
    const editDraftButton = event.target.closest("[data-edit-draft]");
    const moveDraftButton = event.target.closest("[data-move-draft]");
    const exerciseButton = event.target.closest("[data-toggle-exercise]");
    const finishButton = event.target.closest("[data-finish-session]");
    const abandonedFinishButton = event.target.closest("[data-close-abandoned-session]");
    const startRoutineButton = event.target.closest("[data-start-routine]");
    const duplicateRoutineButton = event.target.closest("[data-duplicate-routine]");
    const printRoutineButton = event.target.closest("[data-print-routine]");
    const printPatientButton = event.target.closest("[data-print-patient], [data-print-profile]");
    const openPatientButton = event.target.closest("[data-open-patient]");
    const createAthleteButton = event.target.closest("[data-create-athlete], [data-create-athlete-profile]");
    const deleteAthleteButton = event.target.closest("[data-delete-athlete-access]");
    const closeProfileButton = event.target.closest("[data-close-profile]");
    const newRoutineButton = event.target.closest("[data-profile-new-routine]");
    const editRoutineButton = event.target.closest("[data-edit-routine]");
    const deleteRoutineButton = event.target.closest("[data-delete-routine]");
    const editHistoryButton = event.target.closest("[data-edit-history]");
    const deleteHistoryButton = event.target.closest("[data-delete-history]");
    const toggleProfileEditButton = event.target.closest("[data-toggle-profile-edit]");
    const deleteProfileButton = event.target.closest("[data-delete-profile]");
    const deleteCustomExerciseButton = event.target.closest("[data-delete-custom-exercise]");
    const newRoutinePatientButton = event.target.closest("[data-new-routine-patient]");
    const startFirstRoutineButton = event.target.closest("[data-start-first-routine]");
    const scrollActiveSessionButton = event.target.closest("[data-scroll-active-session]");
    const athleteStartButton = event.target.closest("[data-athlete-start-routine]");
    const athleteToggleExerciseButton = event.target.closest("[data-athlete-toggle-exercise]");
    const athletePauseButton = event.target.closest("[data-athlete-pause-session]");
    const athleteFinishButton = event.target.closest("[data-athlete-finish-session]");

    if (draftButton) {
      exerciseDraft.splice(Number(draftButton.dataset.removeDraft), 1);
      editingExerciseIndex = null;
      renderExerciseDraft();
    }
    if (editDraftButton) {
      editDraftExercise(Number(editDraftButton.dataset.editDraft));
    }
    if (moveDraftButton) {
      const [index, direction] = moveDraftButton.dataset.moveDraft.split(":");
      moveDraftExercise(Number(index), direction);
    }
    if (exerciseButton) {
      const [sessionId, exerciseId] = exerciseButton.dataset.toggleExercise.split(":");
      toggleExercise(sessionId, exerciseId);
    }
    if (finishButton) {
      finishSession(finishButton.dataset.finishSession);
    }
    if (abandonedFinishButton) {
      finishSession(abandonedFinishButton.dataset.closeAbandonedSession, { abandoned: true });
    }
    if (athleteStartButton) {
      event.preventDefault();
      startAthleteRoutine(athleteStartButton.dataset.athleteStartRoutine);
    }
    if (athleteToggleExerciseButton) {
      const [sessionId, exerciseId] = athleteToggleExerciseButton.dataset.athleteToggleExercise.split(":");
      toggleAthleteExercise(sessionId, exerciseId);
    }
    if (athletePauseButton) {
      toggleAthletePause(athletePauseButton.dataset.athletePauseSession);
    }
    if (athleteFinishButton) {
      finishAthleteSession(athleteFinishButton.dataset.athleteFinishSession);
    }
    if (startRoutineButton) {
      startRoutineSession(startRoutineButton.dataset.startRoutine);
    }
    if (duplicateRoutineButton) {
      duplicateRoutine(duplicateRoutineButton.dataset.duplicateRoutine);
    }
    if (editRoutineButton) {
      editRoutine(editRoutineButton.dataset.editRoutine);
    }
    if (deleteRoutineButton) {
      deleteRoutine(deleteRoutineButton.dataset.deleteRoutine);
    }
    if (editHistoryButton) {
      editHistoryRecord(editHistoryButton.dataset.editHistory);
    }
    if (deleteHistoryButton) {
      deleteHistoryRecord(deleteHistoryButton.dataset.deleteHistory);
    }
    if (printRoutineButton) {
      printDocument(buildRoutinePrint(printRoutineButton.dataset.printRoutine));
    }
    if (printPatientButton) {
      const patientId = printPatientButton.dataset.printPatient || selectedPatientId;
      printDocument(buildPatientPrint(patientId));
    }
    if (openPatientButton) {
      openPatientProfile(openPatientButton.dataset.openPatient);
    }
    if (createAthleteButton) {
      createAthleteAccess(createAthleteButton.dataset.createAthlete || selectedPatientId);
    }
    if (deleteAthleteButton) {
      deleteAthleteAccess(deleteAthleteButton.dataset.deleteAthleteAccess);
    }
    if (closeProfileButton) {
      closePatientProfile();
    }
    if (toggleProfileEditButton) {
      $("#profile-form").hidden = !$("#profile-form").hidden;
    }
    if (deleteProfileButton) {
      deleteSelectedPatient();
    }
    if (deleteCustomExerciseButton) {
      deleteCustomExercise(deleteCustomExerciseButton.dataset.deleteCustomExercise);
    }
    if (newRoutinePatientButton) {
      switchView("routines");
      $("#routine-patient").value = newRoutinePatientButton.dataset.newRoutinePatient;
      $("#routine-form").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (startFirstRoutineButton) {
      const routine = state.routines.find((item) => item.patientId === startFirstRoutineButton.dataset.startFirstRoutine);
      if (routine) startRoutineSession(routine.id);
      else window.alert("Este paciente aun no tiene rutinas asignadas.");
    }
    if (scrollActiveSessionButton) {
      $("#athlete-session-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const profileTabButton = event.target.closest("[data-profile-tab]");
    if (profileTabButton) {
      document.querySelectorAll(".profile-tab").forEach((button) => {
        button.classList.toggle("active", button === profileTabButton);
      });
      const showSessions = profileTabButton.dataset.profileTab === "sessions";
      document.querySelector(".profile-routines").hidden = showSessions;
      document.querySelector(".profile-sessions").hidden = !showSessions;
    }
    if (newRoutineButton) {
      const patient = getPatient(selectedPatientId);
      closePatientProfile();
      switchView("routines");
      if (patient) {
        $("#routine-patient").value = patient.id;
      }
    }
  });

  document.body.addEventListener("input", (event) => {
    const input = event.target.closest("[data-athlete-input]");
    if (!input) return;
    const [sessionId, exerciseId, field] = input.dataset.athleteInput.split(":");
    updateAthleteExerciseData(sessionId, exerciseId, field, input.value);
  });

  if (channel) {
    channel.addEventListener("message", (event) => {
      if (event.data?.type !== "sync") return;
      Object.assign(state, ensurePresetProfiles(event.data.state));
      renderAll();
    });
  }
}

function switchView(view) {
  document.body.dataset.view = view;
  document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === view));
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $("#view-title").textContent = views[view];
  const subtitle = $("#view-subtitle");
  if (subtitle) subtitle.textContent = viewSubtitles[view] || "";
}

function tickTimers() {
  document.querySelectorAll("[data-session-timer]").forEach((node) => {
    const session = state.activeSessions.find((item) => item.id === node.dataset.sessionTimer);
    if (session) {
      node.textContent = formatDuration(elapsedSeconds(session));
    }
  });
  document.querySelectorAll("[data-athlete-timer]").forEach((node) => {
    const session = state.activeSessions.find((item) => item.id === node.dataset.athleteTimer);
    if (session) {
      node.textContent = formatDuration(elapsedSeconds(session));
    }
  });
}

document.body.dataset.view = currentSession.role === "admin" ? "dashboard" : "";
bindEvents();
renderClock();
renderAll();
initCloudSync();
setInterval(renderClock, 1000);
setInterval(tickTimers, 1000);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("KINEPRO service worker unavailable", error);
    });
  });
}
