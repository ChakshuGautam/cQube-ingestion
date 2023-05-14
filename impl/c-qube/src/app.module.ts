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
import { DimensionGrammarService } from './services/csv-adapter/parser/dimension-grammar/dimension-grammar.service';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';

const databasePoolFactory = async (configService: ConfigService) => {
  return new Pool({
    user: configService.get('DB_USERNAME'),
    host: configService.get('DB_HOST'),
    database: configService.get('DB_NAME'),
    password: configService.get('DB_PASSWORD'),
    port: configService.get<number>('DB_PORT'),
  });
};

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync<RedisClientOptions>({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        });
        return {
          store: store as unknown as CacheStore,
          ttl: 0, // 1 day in ms
          max: 10 * 1000 * 1000, // 100 MB
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    QueryBuilderService,
    DimensionService,
    DimensionGrammarService,
    DatasetService,
    PipeService,
    TransformerService,
    CsvAdapterService,
    EventService,
    InstrumenttypeService,
    VizService,
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService],
      useFactory: databasePoolFactory,
    },
  ],
})
export class AppModule {}
