export const appText = {
  name: 'Digimon Judge AI',
  shortName: 'Digimon Judge',
  tagline: 'Consulta y administración del Digimon Card Game físico.',
  stage: 'Etapa 1',
  stageDescription:
    'Esqueleto del proyecto, contratos compartidos, API base y PWA. Sin datos oficiales cargados.',
  dataPolicy:
    'No se muestran cartas, reglas ni rulings inventados. Toda información deberá referenciar una fuente verificable.',
  aiStatus: 'IA deshabilitada en esta etapa.',
  apiConnected: 'API conectada',
  apiUnavailable: 'API no disponible',
  apiChecking: 'Comprobando API...',
  modulesTitle: 'Módulos',
  modulesDescription:
    'Cada módulo se implementará por etapas, con pruebas y fuentes oficiales verificadas.',
  sourcesTitle: 'Fuentes y confianza',
  sourcesDescription:
    'Las reglas oficiales, interpretaciones y casos pendientes se almacenarán y mostrarán por separado.',
  footer: 'Proyecto en construcción. Etapa 1: esqueleto y validaciones.',
};

export const cardsText = {
  title: 'Buscador de cartas',
  description:
    'Busca cartas por nombre o identificador. La información se obtiene de la base de datos; no se generan cartas ni reglas.',
  policy:
    'Cada carta debe referenciar su fuente. Las imágenes alternativas solo se muestran cuando existen.',
  searchLabel: 'Nombre o identificador',
  searchPlaceholder: 'Ej. Agumon o BT1-001',
  searchAction: 'Buscar',
  clearAction: 'Limpiar',
  loading: 'Buscando cartas...',
  empty: 'No hay cartas que coincidan con la búsqueda.',
  errorTitle: 'No se pudieron cargar las cartas',
  retry: 'Reintentar',
  resultsLabel: (total: number) => `${total} ${total === 1 ? 'carta' : 'cartas'}`,
  pageLabel: (page: number, totalPages: number) => `Página ${page} de ${totalPages}`,
  prevPage: 'Anterior',
  nextPage: 'Siguiente',
  back: 'Volver al buscador',
  detailTitle: 'Detalle de carta',
  officialText: 'Texto oficial',
  mainArt: 'Imagen de la carta',
  alternateArts: 'Artes alternos',
  source: 'Fuente',
  noImage: 'Sin imagen',
  externalTitle: 'Resultados externos',
  externalBadge: 'Fuente comunitaria',
  externalAttribution:
    'Fuente externa: DigimonCard.io. Datos comunitarios, no oficiales. No se guardan en la base de datos.',
  externalDocsLabel: 'Documentación de DigimonCard.io',
  externalLoading: 'Consultando la fuente externa...',
  externalEmpty: 'La fuente externa no devolvió resultados.',
  externalRateLimited:
    'La fuente externa alcanzó su límite de solicitudes. Intenta de nuevo más tarde.',
  externalTimeout: 'La fuente externa no respondió a tiempo.',
  externalUnavailable:
    'No se pudo consultar la fuente externa. La búsqueda local sigue disponible.',
  externalRetry: 'Reintentar consulta externa',
  fields: {
    id: 'Identificador',
    rarity: 'Rareza',
    cardType: 'Tipo',
    level: 'Nivel',
    dp: 'DP',
    set: 'Set',
    color: 'Color',
    color2: 'Color secundario',
    playCost: 'Coste de juego',
    evolutionCost: 'Coste de evolución',
    form: 'Forma',
    attribute: 'Atributo',
    digiType: 'Tipo Digi',
    series: 'Serie',
    sets: 'Sets',
  },
  effects: {
    main: 'Efecto principal',
    source: 'Efecto de fuente',
    alt: 'Efecto alterno',
  },
};

export interface ModuleDefinition {
  path: string;
  title: string;
  description: string;
}

export const modules: ModuleDefinition[] = [
  {
    path: '/cards',
    title: 'Cartas',
    description: 'Búsqueda por nombre o identificador, texto oficial y fuente de cada carta.',
  },
  {
    path: '/rules',
    title: 'Reglas y palabras clave',
    description: 'Reglas oficiales, definiciones y estados de verificación. Etapa 3.',
  },
  {
    path: '/judge',
    title: 'Resolución de interacciones',
    description: 'Motor determinista para batallas e interacciones. Etapa 4.',
  },
  {
    path: '/effects',
    title: 'Análisis de efectos',
    description: 'Descomposición de efectos con referencias oficiales. Etapa 4.',
  },
  {
    path: '/decks',
    title: 'Constructor de mazos',
    description: 'Creación y análisis de mazos. Etapa 5.',
  },
  {
    path: '/history',
    title: 'Historial y fuentes',
    description: 'Cambios, erratas y trazabilidad de fuentes oficiales. Etapa 6.',
  },
  {
    path: '/admin',
    title: 'Administración',
    description: 'Protegida por Cloudflare Access. Gestión de cartas, reglas y rulings. Etapa 6.',
  },
  {
    path: '/admin/users',
    title: 'Usuarios y acceso',
    description: 'Roles, permisos e identidades de Cloudflare Access. Etapa 6.',
  },
];
