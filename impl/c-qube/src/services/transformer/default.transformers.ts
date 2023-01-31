import { Transformer, TransformSync } from 'src/types/transformer';

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
        return {
          dataset: context.dataset,
          dimensionFilter: events[0].spec.
        };
      }
    },
  },
];
