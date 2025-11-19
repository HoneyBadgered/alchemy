/**
 * AI Label Endpoints
 */

import type { HttpClient } from '../client/http';
import type { LabelDesign, LabelGenerationRequest } from '../types';

export class LabelsEndpoints {
  constructor(private http: HttpClient) {}

  async getOrderLabels(orderId: string): Promise<LabelDesign[]> {
    return this.http.get<LabelDesign[]>(`/orders/${orderId}/labels`);
  }

  async generateLabel(orderId: string, data: LabelGenerationRequest): Promise<LabelDesign> {
    return this.http.post<LabelDesign>(`/orders/${orderId}/labels`, data);
  }

  async updateLabel(labelId: string, data: Partial<LabelDesign>): Promise<LabelDesign> {
    return this.http.patch<LabelDesign>(`/labels/${labelId}`, data);
  }

  async approveLabel(labelId: string): Promise<{ success: boolean }> {
    return this.http.post(`/labels/${labelId}/approve`);
  }
}
