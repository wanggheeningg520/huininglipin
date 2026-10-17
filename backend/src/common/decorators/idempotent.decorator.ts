import { SetMetadata } from '@nestjs/common';

/**
 * 幂等接口标记（对应 design.md 2.1.3 幂等防重）
 * 标记的接口强制要求 X-Idempotency-Key 头，否则拒绝
 */
export const IDEMPOTENT_KEY = 'idempotent';
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);