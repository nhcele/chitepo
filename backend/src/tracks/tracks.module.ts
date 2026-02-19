import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { UserTrackAssignment } from './entities/user-track-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTrackAssignment])],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}

