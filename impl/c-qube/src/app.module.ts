import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryBuilderService } from './services/query-builder/query-builder.service';
import { DimensionService } from './services/dimension/dimension.service';
import { PrismaService } from './prisma.service';
import { DatasetService } from './services/dataset/dataset.service';
import { PipeService } from './services/pipe/pipe.service';
import { TransformerService } from './services/transformer/transformer.service';
import { CsvAdapterService } from './services/csv-adapter/csv-adapter.service';
import { EventService } from './services/event/event.service';
import { InstrumenttypeService } from './services/instrumenttype/instrumenttype.service';
import { VizService } from './services/viz/viz.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    QueryBuilderService,
    DimensionService,
    DatasetService,
    PipeService,
    TransformerService,
    CsvAdapterService,
    EventService,
    InstrumenttypeService,
    VizService,
  ],
})
export class AppModule {}
