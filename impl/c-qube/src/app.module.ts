import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryBuilderService } from './services/query-builder/query-builder.service';
import { DimensionService } from './services/dimension/dimension.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PrismaService, QueryBuilderService, DimensionService],
})
export class AppModule {}
