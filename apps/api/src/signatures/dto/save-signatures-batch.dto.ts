import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SignatureSlotDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slotId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsIn(['WRITTEN', 'FACIAL'])
  type!: 'WRITTEN' | 'FACIAL';

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  signerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  signerDocument?: string;

  @IsOptional()
  @IsString()
  @MinLength(100)
  signatureImageBase64?: string;

  @IsOptional()
  @IsUUID()
  signatureId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  signatureImageKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  signatureImageHash?: string;

  @IsOptional()
  @IsString()
  @MinLength(100)
  faceImageBase64?: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  faceImageHash?: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  signatureKey?: string;
}

export class SaveSignaturesBatchDto {
  @IsUUID()
  documentId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignatureSlotDto)
  signatures!: SignatureSlotDto[];
}
