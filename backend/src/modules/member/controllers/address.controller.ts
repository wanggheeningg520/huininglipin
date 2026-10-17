import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressService } from '../services/address.service';
import { AddressDto } from '../dto/address.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';

/** 收货地址 Controller（对应 design.md 2.2.2 接口21-24） */
@ApiTags('会员-地址')
@Controller('member/address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: '收货地址列表（接口21）' })
  async list(@CurrentUser('userId') userId: number) {
    return this.addressService.list(userId);
  }

  @Post()
  @ApiOperation({ summary: '新增地址（接口22）' })
  async create(@CurrentUser('userId') userId: number, @Body() dto: AddressDto) {
    const id = await this.addressService.create(userId, dto);
    return { id };
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑地址（接口22）' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id') id: number,
    @Body() dto: AddressDto,
  ) {
    await this.addressService.update(userId, Number(id), dto);
    return { id: Number(id) };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除地址（接口23）' })
  async remove(@CurrentUser('userId') userId: number, @Param('id') id: number) {
    await this.addressService.remove(userId, Number(id));
    return null;
  }

  @Patch(':id/default')
  @ApiOperation({ summary: '设置默认地址（接口24）' })
  async setDefault(@CurrentUser('userId') userId: number, @Param('id') id: number) {
    await this.addressService.setDefault(userId, Number(id));
    return null;
  }
}