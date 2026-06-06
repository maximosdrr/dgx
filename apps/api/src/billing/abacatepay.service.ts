import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface AbacateCustomer {
  id: string;
  name: string;
  email: string;
  taxId: string;
}

export interface AbacateBilling {
  id: string;
  url: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  amount: number;
}

export interface CreateBillingParams {
  customerName: string;
  customerEmail: string;
  customerTaxId: string;
  productName: string;
  productExternalId: string;
  priceInCents: number;
  returnUrl: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class AbacatePayService {
  private readonly logger = new Logger(AbacatePayService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.getOrThrow<string>('ABACATEPAY_API_KEY');
    this.http = axios.create({
      baseURL: 'https://api.abacatepay.com/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });
  }

  async createOrGetCustomer(
    name: string,
    email: string,
    taxId: string,
  ): Promise<AbacateCustomer> {
    try {
      const { data } = await this.http.post('/customers/create', {
        name,
        email,
        taxId,
      });
      return data.data ?? data;
    } catch (err: any) {
      this.logger.error('AbacatePay createCustomer failed', err?.response?.data);
      throw new InternalServerErrorException('Failed to create billing customer');
    }
  }

  async createBilling(params: CreateBillingParams): Promise<AbacateBilling> {
    try {
      const { data } = await this.http.post('/billing/create', {
        frequency: 'ONE_TIME',
        methods: ['PIX', 'BOLETO'],
        products: [
          {
            externalId: params.productExternalId,
            name: params.productName,
            quantity: 1,
            price: params.priceInCents,
          },
        ],
        customer: {
          name: params.customerName,
          email: params.customerEmail,
          taxId: params.customerTaxId,
        },
        returnUrl: params.returnUrl,
        metadata: params.metadata ?? {},
      });
      return data.data ?? data;
    } catch (err: any) {
      this.logger.error('AbacatePay createBilling failed', err?.response?.data);
      throw new InternalServerErrorException('Failed to create billing charge');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = this.config.get<string>('ABACATEPAY_WEBHOOK_SECRET', '');
    if (!secret) return true; // dev mode: skip
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }
}
