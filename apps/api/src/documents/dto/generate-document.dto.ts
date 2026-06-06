import { IsUUID, IsObject } from 'class-validator';

export class GenerateDocumentDto {
  @IsUUID()
  templateId: string;

  @IsObject()
  variables: Record<string, string>;
}
