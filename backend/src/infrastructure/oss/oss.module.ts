import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OssService } from './oss.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OssService],
  exports: [OssService],
})
export class OssModule {}