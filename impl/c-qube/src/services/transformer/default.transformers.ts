import { Transformer, TransformSync } from 'src/types/transformer';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');
import { DataFrame } from 'nodejs-polars';
import { DatasetUpdateRequest } from 'src/types/dataset';
import { Event as cQubeEvent } from 'src/types/event';

export const defaultTransformers: Transformer[] = [
  {
    name: 'passThrough',
    suggestiveEvent: [],
    suggestiveDataset: [],
    isChainable: true,
    transformSync: (callback, context, events) => {
      callback(null, context, events);
      const modifiedEvents = events;
      if (context.isChainable) {
        return modifiedEvents;
      } else {
        // Generate Dataframe from events using EventGrammar
        const eventData = events
          .map((event: cQubeEvent) => event.data)
          .map((x) => {
            return {
              counter: parseInt(x['counter']),
              date: x['date'],
              name: x['name'],
            };
          })
          .filter((x) => !Number.isNaN(x['counter']))
          .filter((x) => x['date'] === '11/01/23');

        // TODO: Change the above date string to regex

        const newDF: DataFrame = pl.readRecords(eventData, {
          inferSchemaLength: 10,
        });
        const changedDF = newDF
          .groupBy('date', 'name')
          .agg(
            pl.avg('counter').alias('avg'),
            pl.count('counter').alias('count'),
            pl.col('counter').sum().alias('sum'),
          );
        const datasetUpdateRequests: DatasetUpdateRequest[] = changedDF
          .select('date', 'name', 'avg', 'count', 'sum')
          .map((x) => {
            return {
              dataset: context.dataset,
              dimensionFilter: events[0].spec.name,
              updateParams: {
                sum: x[4],
                count: x[3],
                avg: x[2],
              },
              filterParams: {
                date: x[0],
                dimensions_pdata_id: x[1],
              },
            };
          });
        return datasetUpdateRequests;
      }
    },
  },
];
