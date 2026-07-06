import { Module } from '@nestjs/common';
import { ShariaService } from './sharia.service';

@Module({
  providers: [ShariaService],
  exports: [ShariaService],
})
export class ShariaModule {}
