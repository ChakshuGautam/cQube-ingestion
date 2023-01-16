// Code transformer interface as an akka actor

import { CallbackHandler } from 'supertest';
import { Dataset, DatasetGrammar } from './dataset';
import { EventGrammar } from './event';

export type TransformAsync = (
  callback: CallbackHandler,
  event: Event,
) => Promise<Event | Dataset>;

export type TransformSync = (
  callback: CallbackHandler,
  event: Event,
) => Event | Dataset;

export interface Transformer {
  name: string;
  event: EventGrammar;
  dataset: DatasetGrammar;

  // TODO: Make one of these two required
  transformAsync?: TransformAsync;

  transformSync?: TransformSync;
}

// Crude implementation of AKKA actor
export const stringToTransformAsync = (
  transformAsync: string,
): TransformAsync => {
  return (callback, event) => {
    // event will be processed by eval
    return new Promise((resolve, reject) => {
      try {
        const result = eval(transformAsync);
        callback(null, result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };
};

export const stringToTransformSync = (transformSync: string): TransformSync => {
  return (callback, event) => {
    try {
      const result = eval(transformSync);
      callback(null, result);
      return result;
    } catch (error) {
      throw error;
    }
  };
};
