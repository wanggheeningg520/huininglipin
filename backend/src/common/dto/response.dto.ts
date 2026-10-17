import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 统一响应体（对应 design.md 2.2.1 统一响应体）
 * { code, message, data, traceId? }
 */
export class ResponseDto<T = any> {
  @ApiProperty({ description: '业务错误码，0 表示成功', example: 0 })
  code: number;

  @ApiProperty({ description: '描述', example: 'success' })
  message: string;

  @ApiProperty({ description: '业务数据', nullable: true })
  data: T | null;

  @ApiPropertyOptional({ description: '链路追踪 ID' })
  traceId?: string;

  static success<T>(data: T, message = 'success'): ResponseDto<T> {
    const r = new ResponseDto<T>();
    r.code = 0;
    r.message = message;
    r.data = data;
    return r;
  }

  static error(code: number, message: string, traceId?: string): ResponseDto<null> {
    const r = new ResponseDto<null>();
    r.code = code;
    r.message = message;
    r.data = null;
    r.traceId = traceId;
    return r;
  }
}


/** 分页结果 */
export class PaginatedResult<T> {
  @ApiProperty({ type: 'array' })
  list: T[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  static of<T>(list: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
    const r = new PaginatedResult<T>();
    r.list = list;
    r.total = total;
    r.page = page;
    r.pageSize = pageSize;
    return r;
  }
}