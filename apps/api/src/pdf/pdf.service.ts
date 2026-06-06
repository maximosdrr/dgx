import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly gotenbergUrl: string;

  constructor(private readonly config: ConfigService) {
    this.gotenbergUrl = config.get<string>('GOTENBERG_URL', 'http://localhost:3002');
  }

  renderHtml(templateContent: string, variables: Record<string, string>): string {
    const compiled = Handlebars.compile(templateContent);
    return compiled(variables);
  }

  async generatePdf(html: string): Promise<Buffer> {
    const fullHtml = this.wrapHtml(html);

    const form = new FormData();
    form.append('files', Buffer.from(fullHtml, 'utf-8'), {
      filename: 'index.html',
      contentType: 'text/html',
    });
    form.append('paperWidth', '8.27');
    form.append('paperHeight', '11.69');
    form.append('marginTop', '0.79');
    form.append('marginBottom', '0.79');
    form.append('marginLeft', '0.79');
    form.append('marginRight', '0.79');
    form.append('printBackground', 'true');

    try {
      const response = await axios.post(
        `${this.gotenbergUrl}/forms/chromium/convert/html`,
        form,
        {
          headers: form.getHeaders(),
          responseType: 'arraybuffer',
          timeout: 60_000,
        },
      );
      return Buffer.from(response.data);
    } catch (err: any) {
      this.logger.error('Gotenberg PDF generation failed', err?.message);
      throw new InternalServerErrorException('PDF generation failed');
    }
  }

  private wrapHtml(body: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
    }
    h1 { font-size: 18pt; margin-bottom: 16px; }
    h2 { font-size: 14pt; margin-bottom: 12px; }
    p  { margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    th { background: #f5f5f5; }
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid #333;
      width: 280px;
      text-align: center;
      padding-top: 6px;
    }
  </style>
</head>
<body>${body}</body>
</html>`;
  }
}
