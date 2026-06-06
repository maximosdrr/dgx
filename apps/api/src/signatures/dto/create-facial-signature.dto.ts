import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateFacialSignatureDto {
  @IsUUID()
  documentId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  signerName!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(32)
  signerDocument!: string;

  @IsString()
  @MinLength(100)
  faceImageBase64!: string;
}
