/**
 * Labels Service (AI-Powered Custom Labels)
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';

export interface LabelGenerationInput {
  stylePreset?: string;
  tonePreset?: string;
  flavorNotes?: string;
  customPrompt?: string;
}

export interface LabelUpdateInput {
  name?: string;
  tagline?: string;
  description?: string;
  artworkPrompt?: string;
  artworkUrl?: string;
}

export class LabelsService {
  async getOrderLabels(userId: string, orderId: string) {
    // Verify order belongs to user
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get labels for this order
    const labels = await prisma.label_designs.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return labels;
  }

  async generateLabel(userId: string, orderId: string, input: LabelGenerationInput) {
    // Verify order belongs to user and is paid
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'paid',
      },
    });

    if (!order) {
      throw new Error('Order not found or not paid');
    }

    // In a real implementation, this would call an AI service (OpenAI, etc.)
    // For now, we'll generate a simple placeholder label
    const { stylePreset = 'classic', tonePreset = 'whimsical', flavorNotes = '', customPrompt = '' } = input;

    // Generate placeholder content
    const name = `Custom Blend #${Date.now()}`;
    const tagline = `A ${tonePreset} creation`;
    const description = `This blend was crafted with ${stylePreset} style${flavorNotes ? ` featuring ${flavorNotes}` : ''}. ${customPrompt}`;

    // Create label
    const label = await prisma.label_designs.create({
      data: {
        orderId,
        name,
        tagline,
        description,
        stylePreset,
        tonePreset,
        status: 'draft',
      },
    });

    return label;
  }

  async updateLabel(userId: string, labelId: string, input: LabelUpdateInput) {
    // Get label and verify ownership
    const label = await prisma.label_designs.findUnique({
      where: { id: labelId },
      include: {
        order: true,
      },
    });

    if (!label) {
      throw new Error('Label not found');
    }

    if (label.order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (label.status === 'approved') {
      throw new Error('Cannot update approved label');
    }

    // Update label
    const updatedLabel = await prisma.label_designs.update({
      where: { id: labelId },
      data: input,
    });

    return updatedLabel;
  }

  async approveLabel(userId: string, labelId: string) {
    // Get label and verify ownership
    const label = await prisma.label_designs.findUnique({
      where: { id: labelId },
      include: {
        order: true,
      },
    });

    if (!label) {
      throw new Error('Label not found');
    }

    if (label.order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (label.status === 'approved') {
      throw new Error('Label already approved');
    }

    // Approve label
    await prisma.label_designs.update({
      where: { id: labelId },
      data: {
        status: 'approved',
      },
    });

    // TODO: Emit LABEL_APPROVED event for analytics/rewards

    return { success: true };
  }
}
