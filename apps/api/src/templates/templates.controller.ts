import {
  Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService, MulterFile } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '@docgen/shared';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.templatesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.templatesService.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: UserPayload) {
    return this.templatesService.create(dto, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.templatesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.templatesService.remove(id, user);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: UserPayload,
  ) {
    return this.templatesService.uploadImage(file, user);
  }
}
