import { SetMetadata } from '@nestjs/common';

/** 公开接口标记（对应 design.md 2.2.1 鉴权方案） */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);