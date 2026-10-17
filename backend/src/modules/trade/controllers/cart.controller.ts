import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import { AddCartDto, CheckCartDto } from '../dto/trade.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';

/** 购物车 Controller（对应 design.md 2.2.2 接口5-8） */
@ApiTags('交易-购物车')
@Controller('trade/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '购物车列表（接口5）' })
  async list(@CurrentUser('userId') userId: number) {
    return this.cartService.list(userId);
  }

  @Post()
  @ApiOperation({ summary: '加购/更新购物车（接口6）' })
  async add(@CurrentUser('userId') userId: number, @Body() dto: AddCartDto) {
    const cartId = await this.cartService.add(userId, dto);
    return { cartId };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除购物车项（接口7）' })
  async remove(@CurrentUser('userId') userId: number, @Param('id') id: number) {
    await this.cartService.remove(userId, Number(id));
    return null;
  }

  @Patch('check')
  @ApiOperation({ summary: '勾选/取消勾选（接口8）' })
  async check(@CurrentUser('userId') userId: number, @Body() dto: CheckCartDto) {
    await this.cartService.check(userId, dto);
    return null;
  }
}