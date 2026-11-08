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

export interface ModuleDefinition {
  path: string;
  title: string;
  description: string;
}

export const modules: ModuleDefinition[] = [
  {
    path: '/search',
    title: 'Buscador de cartas',
    description: 'Búsqueda por nombre e identificador. Se implementará en la Etapa 2.',
  },
  {
    path: '/cards',
    title: 'Base de datos de cartas',
    description: 'Consulta de cartas y sus efectos oficiales. Se implementará en la Etapa 2.',
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
