import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateWrittenSignatureDto {
  @IsUUID()
  documentId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  signerName!: string;

  @IsString()
  @MinLength(100)
  signatureImageBase64!: string;
}
