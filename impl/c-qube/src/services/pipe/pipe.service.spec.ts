import { Test, TestingModule } from '@nestjs/testing';
import { group } from 'console';
import { DataFrame } from 'nodejs-polars';
import { PipeService } from './pipe.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

describe('PipeService', () => {
  let service: PipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PipeService],
    }).compile();

    service = module.get<PipeService>(PipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should groupby a dataframe', () => {
    const df: DataFrame = pl.readRecords([
      {
        a: 1,
        b: 2,
        c: 3,
      },
      {
        a: 1,
        b: 4,
        c: 3,
      },
      {
        a: 'test',
        b: 4,
        c: 3,
      },
    ]);
    const grouped = df
      .groupBy('a')
      .agg(
        pl.avg('b').alias('sum'),
        pl.col('b').sum().alias('sum-b'),
        pl.count('b').alias('count-b'),
      );
    // console.log('grouped', grouped);
  });
});
