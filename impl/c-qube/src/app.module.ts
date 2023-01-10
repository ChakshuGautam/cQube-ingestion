import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SqlQueryBuilderService } from './sql-query-builder/sql-query-builder.service';
import { QueryBuilderService } from './query-builder/query-builder.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, SqlQueryBuilderService, QueryBuilderService],
})
export class AppModule {}
