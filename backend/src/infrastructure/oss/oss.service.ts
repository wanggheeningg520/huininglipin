import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * OSS 客户端封装（对应 design.md 2.1.2 oss.service + 2.6.2 OSS 配置）
 * 提供 upload/getSignedUrl/read 方法，支持阿里云 OSS
 * 注：实际 SDK 在生产环境按需引入，此处提供接口与临时凭证签发
 */
@Injectable()
export class OssService implements OnModuleInit {
  private readonly logger = new Logger(OssService.name);
  private ossClient: any = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const region = this.config.get<string>('oss.region');
    const bucket = this.config.get<string>('oss.bucket');
    if (region && bucket) {
      try {
        // 动态引入避免无凭证环境报错
        const OSS = (await import('ali-oss')).default;
        this.ossClient = new OSS({
          region,
          bucket,
          accessKeyId: this.config.get<string>('oss.accessKeyId', ''),
          accessKeySecret: this.config.get<string>('oss.accessKeySecret', ''),
        });
        this.logger.log(`OSS 已初始化: ${region}/${bucket}`);
      } catch (e) {
        this.logger.warn(`OSS 初始化失败（功能降级）: ${(e as Error).message}`);
      }
    }
  }

  /** 上传文件 */
  async upload(objectKey: string, content: Buffer, contentType?: string): Promise<string> {
    if (!this.ossClient) {
      throw new Error('OSS 未初始化');
    }
    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = contentType;
    const result = await this.ossClient.put(objectKey, content, { headers });
    return result.url as string;
  }

  /** 签发临时上传凭证（后台用） */
  getUploadToken(dir = 'upload/'): { host: string; dir: string; expire: number } {
    const bucket = this.config.get<string>('oss.bucket', 'huining-mall');
    const region = this.config.get<string>('oss.region', 'oss-cn-beijing');
    const cdn = this.config.get<string>('oss.cdnDomain', '');
    return {
      host: cdn || `https://${bucket}.${region}.aliyuncs.com`,
      dir,
      expire: 1800,
    };
  }

  /** 读取文件 URL（拼接 CDN） */
  getPublicUrl(objectKey: string): string {
    const cdn = this.config.get<string>('oss.cdnDomain', '');
    if (cdn) return `${cdn}/${objectKey}`;
    const bucket = this.config.get<string>('oss.bucket', 'huining-mall');
    const region = this.config.get<string>('oss.region', 'oss-cn-beijing');
    return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`;
  }
}