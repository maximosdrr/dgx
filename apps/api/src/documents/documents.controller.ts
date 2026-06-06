import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '@docgen/shared';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('generate')
  generate(@Body() dto: GenerateDocumentDto, @CurrentUser() user: UserPayload) {
    return this.documentsService.generate(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.documentsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.documentsService.findOne(id, user);
  }
}
