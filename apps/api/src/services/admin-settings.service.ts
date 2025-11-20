/**
 * Admin Site Settings Service
 */

import { prisma } from '../utils/prisma';

export class AdminSettingsService {
  // ============================================
  // Site Settings
  // ============================================

  async getSiteSettings() {
    const settings = await prisma.siteSettings.findMany({
      orderBy: { category: 'asc' },
    });

    return settings;
  }

  async getSiteSetting(key: string) {
    const setting = await prisma.siteSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new Error('Setting not found');
    }

    return setting;
  }

  async updateSiteSetting(key: string, value: string) {
    const setting = await prisma.siteSettings.upsert({
      where: { key },
      create: {
        key,
        value,
        category: 'general',
      },
      update: { value },
    });

    return setting;
  }

  async createSiteSetting(data: {
    key: string;
    value: string;
    description?: string;
    category?: string;
  }) {
    const setting = await prisma.siteSettings.create({
      data: {
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category ?? 'general',
      },
    });

    return setting;
  }

  // ============================================
  // Shipping Methods
  // ============================================

  async getShippingMethods() {
    const methods = await prisma.shippingMethod.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return methods;
  }

  async getShippingMethod(id: string) {
    const method = await prisma.shippingMethod.findUnique({
      where: { id },
    });

    if (!method) {
      throw new Error('Shipping method not found');
    }

    return method;
  }

  async createShippingMethod(data: {
    name: string;
    description?: string;
    price: number;
    estimatedDays?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const method = await prisma.shippingMethod.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        estimatedDays: data.estimatedDays,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return method;
  }

  async updateShippingMethod(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    estimatedDays?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const method = await prisma.shippingMethod.update({
      where: { id },
      data,
    });

    return method;
  }

  async deleteShippingMethod(id: string) {
    await prisma.shippingMethod.delete({
      where: { id },
    });

    return { success: true };
  }

  // ============================================
  // Tax Rates
  // ============================================

  async getTaxRates() {
    const rates = await prisma.taxRate.findMany({
      orderBy: { region: 'asc' },
    });

    return rates;
  }

  async getTaxRate(id: string) {
    const rate = await prisma.taxRate.findUnique({
      where: { id },
    });

    if (!rate) {
      throw new Error('Tax rate not found');
    }

    return rate;
  }

  async createTaxRate(data: {
    name: string;
    region: string;
    rate: number;
    isActive?: boolean;
  }) {
    const taxRate = await prisma.taxRate.create({
      data: {
        name: data.name,
        region: data.region,
        rate: data.rate,
        isActive: data.isActive ?? true,
      },
    });

    return taxRate;
  }

  async updateTaxRate(id: string, data: {
    name?: string;
    region?: string;
    rate?: number;
    isActive?: boolean;
  }) {
    const taxRate = await prisma.taxRate.update({
      where: { id },
      data,
    });

    return taxRate;
  }

  async deleteTaxRate(id: string) {
    await prisma.taxRate.delete({
      where: { id },
    });

    return { success: true };
  }

  // ============================================
  // Discount Codes
  // ============================================

  async getDiscountCodes() {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return codes;
  }

  async getDiscountCode(id: string) {
    const code = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!code) {
      throw new Error('Discount code not found');
    }

    return code;
  }

  async createDiscountCode(data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    validFrom: Date;
    validUntil?: Date;
    isActive?: boolean;
  }) {
    const discountCode = await prisma.discountCode.create({
      data: {
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        isActive: data.isActive ?? true,
      },
    });

    return discountCode;
  }

  async updateDiscountCode(id: string, data: {
    code?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    minOrderAmount?: number;
    maxUses?: number;
    validFrom?: Date;
    validUntil?: Date;
    isActive?: boolean;
  }) {
    const discountCode = await prisma.discountCode.update({
      where: { id },
      data,
    });

    return discountCode;
  }

  async deleteDiscountCode(id: string) {
    await prisma.discountCode.delete({
      where: { id },
    });

    return { success: true };
  }

  // ============================================
  // Email Templates
  // ============================================

  async getEmailTemplates() {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    return templates;
  }

  async getEmailTemplate(id: string) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Email template not found');
    }

    return template;
  }

  async createEmailTemplate(data: {
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    isActive?: boolean;
  }) {
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText,
        isActive: data.isActive ?? true,
      },
    });

    return template;
  }

  async updateEmailTemplate(id: string, data: {
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    isActive?: boolean;
  }) {
    const template = await prisma.emailTemplate.update({
      where: { id },
      data,
    });

    return template;
  }

  async deleteEmailTemplate(id: string) {
    await prisma.emailTemplate.delete({
      where: { id },
    });

    return { success: true };
  }
}
