// Code transformer interface as an akka actor

import { Dataset, DatasetGrammar, DatasetUpdateRequest } from './dataset';
import { EventGrammar, Event } from './event';

type CallbackHandler = (
  err: any,
  context: TransformerContext,
  events: Event[],
) => void;

export type TransformerContext = {
  dataset: DatasetGrammar;
  events: Event[];
  isChainable: boolean;
  pipeContext: any;
};

export type TransformAsync = (
  callback: CallbackHandler,
  context: TransformerContext,
  events: Event[],
) => Promise<Event[] | DatasetUpdateRequest[]>;

export type TransformSync = (
  callback: CallbackHandler,
  context: TransformerContext,
  events: Event[],
) => Event[] | DatasetUpdateRequest[];

export interface Transformer {
  name: string;
  suggestiveEvent: EventGrammar[];
  suggestiveDataset: DatasetGrammar[];
  isChainable: boolean;

  // TODO: Make one of these two required
  transformAsync?: TransformAsync;

  transformSync?: TransformSync;
}
