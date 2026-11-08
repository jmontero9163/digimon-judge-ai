export interface AppEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  AI_ENABLED: string;
  GEMINI_API_KEY?: string;
}

export interface AppVariables {
  requestId: string;
  adminEmail?: string;
}

export interface AppContext {
  Bindings: AppEnv;
  Variables: AppVariables;
}
