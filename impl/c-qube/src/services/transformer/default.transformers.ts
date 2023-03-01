import { Transformer, TransformSync } from 'src/types/transformer';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');
import { DataFrame } from 'nodejs-polars';
import { DatasetUpdateRequest } from 'src/types/dataset';
import { Event as cQubeEvent, EventGrammar } from 'src/types/event';

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
        // const eventData = events
        //   .map((event: cQubeEvent) => event.data)
        //   .map((x) => {
        //     return {
        //       counter: parseInt(x['counter']),
        //       date: x['date'],
        //       name: x['name'],
        //     };
        //   })
        //   .filter((x) => !Number.isNaN(x['counter']))
        //   .filter((x) => x['date'] === '11/01/23');

        const eventData = events.map((event: cQubeEvent) => event.data);
        const eventGrammar = events[0].spec;
        const datasetGrammar = context.dataset;

        const instrumentField = eventGrammar.instrument_field;

        // TODO: Change the above date string to regex

        const newDF: DataFrame = pl.readRecords(eventData, {
          inferSchemaLength: 10,
        });
        const changedDF = newDF
          .groupBy(
            datasetGrammar.timeDimension.key,
            datasetGrammar.dimensions[0].key,
          )
          .agg(
            pl.avg(instrumentField).alias('avg'),
            pl.count(instrumentField).alias('count'),
            pl.col(instrumentField).sum().alias('sum'),
          );
        const datasetUpdateRequests: DatasetUpdateRequest[] = changedDF
          .select(
            datasetGrammar.timeDimension.key,
            datasetGrammar.dimensions[0].key,
            'avg',
            'count',
            'sum',
          )
          .map((x) => {
            return {
              dataset: datasetGrammar,
              dimensionFilter: eventGrammar.name,
              updateParams: {
                sum: x[4],
                count: x[3],
                avg: x[2],
              },
              filterParams: {
                [datasetGrammar.timeDimension.key]: x[0],
                [datasetGrammar.dimensions[0].key]: x[1],
              },
            };
          });
        return datasetUpdateRequests;
      }
    },
  },
];
