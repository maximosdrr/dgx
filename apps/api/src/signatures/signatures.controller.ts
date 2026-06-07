import { Body, Controller, Post, Req } from '@nestjs/common';
import { UserPayload } from '@docgen/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFacialSignatureDto } from './dto/create-facial-signature.dto';
import { CreateWrittenSignatureDto } from './dto/create-written-signature.dto';
import { SaveSignaturesBatchDto } from './dto/save-signatures-batch.dto';
import { SignaturesService } from './signatures.service';

interface RequestWithIp {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

@Controller('signatures')
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post('written')
  createWrittenSignature(
    @Body() dto: CreateWrittenSignatureDto,
    @CurrentUser() user: UserPayload,
    @Req() request: RequestWithIp,
  ) {
    return this.signaturesService.createWrittenSignature(dto, user, this.getIp(request));
  }

  @Post('facial')
  createFacialSignature(
    @Body() dto: CreateFacialSignatureDto,
    @CurrentUser() user: UserPayload,
    @Req() request: RequestWithIp,
  ) {
    return this.signaturesService.createFacialSignature(dto, user, this.getIp(request));
  }

  @Post('batch')
  saveBatch(
    @Body() dto: SaveSignaturesBatchDto,
    @CurrentUser() user: UserPayload,
    @Req() request: RequestWithIp,
  ) {
    return this.signaturesService.saveBatch(dto, user, this.getIp(request));
  }

  private getIp(request: RequestWithIp): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    return Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim() || request.ip || request.socket?.remoteAddress;
  }
}
