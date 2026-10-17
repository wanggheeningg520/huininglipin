import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { OssService } from '../../../infrastructure/oss/oss.service';

/**
 * 后台 OSS Controller（对应 design.md 2.2.2 后台 OSS 接口）
 * 签发临时上传凭证
 */
@ApiTags('后台-OSS')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/oss')
export class AdminOssController {
  constructor(private readonly ossService: OssService) {}

  @Get('upload-token')
  @Roles('system:read')
  @ApiOperation({ summary: '签发临时上传凭证' })
  async getUploadToken(@Query('dir') dir?: string) {
    return this.ossService.getUploadToken(dir || 'upload/');
  }
}