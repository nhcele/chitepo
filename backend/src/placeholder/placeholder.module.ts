import { Module } from '@nestjs/common';
import { PlaceholderController } from '../files/placeholder.controller';

@Module({
  controllers: [PlaceholderController],
})
export class PlaceholderModule {}
