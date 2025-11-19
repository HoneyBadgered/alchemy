/**
 * The Alchemy Table API Client
 */

import { HttpClient, type HttpClientConfig } from './client/http';
import { AuthEndpoints } from './endpoints/auth';
import { CatalogEndpoints } from './endpoints/catalog';
import { CraftingEndpoints } from './endpoints/crafting';
import { GamificationEndpoints } from './endpoints/gamification';
import { CosmeticsEndpoints } from './endpoints/cosmetics';
import { LabelsEndpoints } from './endpoints/labels';

export class AlchemyClient {
  private http: HttpClient;

  public auth: AuthEndpoints;
  public catalog: CatalogEndpoints;
  public crafting: CraftingEndpoints;
  public gamification: GamificationEndpoints;
  public cosmetics: CosmeticsEndpoints;
  public labels: LabelsEndpoints;

  constructor(config: HttpClientConfig) {
    this.http = new HttpClient(config);

    this.auth = new AuthEndpoints(this.http);
    this.catalog = new CatalogEndpoints(this.http);
    this.crafting = new CraftingEndpoints(this.http);
    this.gamification = new GamificationEndpoints(this.http);
    this.cosmetics = new CosmeticsEndpoints(this.http);
    this.labels = new LabelsEndpoints(this.http);
  }

  setAccessToken(token: string | undefined) {
    this.http.setAccessToken(token);
  }
}

// Re-export types
export * from './types';
export type { HttpClientConfig };
