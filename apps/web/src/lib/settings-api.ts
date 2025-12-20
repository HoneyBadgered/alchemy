import { apiClient } from '../lib/api-client';

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchSiteSettings(token?: string): Promise<SiteSetting[]> {
  const res = await apiClient.get<{ settings: SiteSetting[] }>('/admin/settings/site', token);
  return res.settings;
}

export async function updateSiteSetting(key: string, value: string, token?: string): Promise<SiteSetting> {
  const res = await apiClient.put<{ setting: SiteSetting }>(`/admin/settings/site/${key}`, { value }, token);
  return res.setting;
}
