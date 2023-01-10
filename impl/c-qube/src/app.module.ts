import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryBuilderService } from './query-builder/query-builder.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, QueryBuilderService],
})
export class AppModule {}
