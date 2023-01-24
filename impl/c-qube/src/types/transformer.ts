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
