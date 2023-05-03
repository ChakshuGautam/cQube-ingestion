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

        if (events.length > 0) {
          const eventData = events.map((event: cQubeEvent) => event.data);
          const eventGrammar = events[0].spec;
          const datasetGrammar = context.dataset;

          const instrumentField = eventGrammar.instrument_field;
          const timeDimensionKeys: string[] = [];

          try {
            if (datasetGrammar.timeDimension) {
              if (datasetGrammar.timeDimension.key === 'date') {
                timeDimensionKeys.push('date');
              } else if (datasetGrammar.timeDimension.key === 'month') {
                timeDimensionKeys.push('month');
                timeDimensionKeys.push('year');
              } else if (datasetGrammar.timeDimension.key === 'week') {
                timeDimensionKeys.push('week');
                timeDimensionKeys.push('year');
              } else {
                timeDimensionKeys.push('year');
              }
            }
          } catch (e) {
            console.log(e);
            console.log(datasetGrammar.timeDimension.key);
          }

          // TODO: Change the above date string to regex
          // console.log(
          //   eventData[0],
          //   datasetGrammar.dimensions.map((x) => x.key),
          //   datasetGrammar.name,
          // );

          const newDF: DataFrame = pl.readRecords(eventData, {
            inferSchemaLength: 10,
          });
          try {
            const changedDF = newDF
              .groupBy(
                ...timeDimensionKeys,
                ...datasetGrammar.dimensions.map((x) => x.key),
              )
              .agg(
                pl.avg(instrumentField).alias('avg'),
                pl.count(instrumentField).alias('count'),
                pl.col(instrumentField).sum().alias('sum'),
              );
            const datasetUpdateRequests: DatasetUpdateRequest[] = changedDF
              .select(
                'count',
                'sum',
                'avg',
                ...timeDimensionKeys,
                ...datasetGrammar.dimensions.map((x) => x.key),
              )
              .map((x) => {
                let indexOfTimeDimensions = 3; //0, 1, 2 are count, sum, avg
                const filterParams: Record<string, string> = {};
                for (let i = 0; i < timeDimensionKeys.length; i++) {
                  filterParams[`${timeDimensionKeys[i]}`] =
                    x[indexOfTimeDimensions];
                  indexOfTimeDimensions += 1;
                }
                for (let i = 0; i < datasetGrammar.dimensions.length; i++) {
                  filterParams[`${datasetGrammar.dimensions[i].key}`] =
                    x[indexOfTimeDimensions];
                  indexOfTimeDimensions += 1;
                }

                return {
                  dataset: datasetGrammar,
                  dimensionFilter: eventGrammar.name,
                  updateParams: {
                    count: x[0],
                    sum: x[1],
                    avg: x[2],
                  },
                  filterParams,
                };
              });
            return datasetUpdateRequests;
          } catch (e) {
            console.log(e);
            console.log(eventData[0]);
            console.log(timeDimensionKeys);
            console.log(datasetGrammar.timeDimension);
            console.log(datasetGrammar.dimensions.map((x) => x.key));
            console.log(datasetGrammar.name);
          }
        } else {
          console.error(
            'No events for the following dataset',
            context.dataset.name,
          );
          return [];
        }
      }
    },
  },
];
