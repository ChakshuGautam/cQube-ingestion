import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryBuilderService } from './servcies/query-builder/query-builder.service';
import { DimensionService } from './service/dimension/dimension.service';
import { DimensionService } from './services/dimension/dimension.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, QueryBuilderService, DimensionService],
})
export class AppModule {}
