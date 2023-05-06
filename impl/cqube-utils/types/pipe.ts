import { DatasetGrammar } from './dataset';
import { EventGrammar } from './event';
import { Transformer } from './transformer';

export interface Pipe {
  event: EventGrammar;
  transformer: Transformer;
  dataset: DatasetGrammar;
}
