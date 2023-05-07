import { DatasetUpdateRequest } from 'src/types/dataset';
import * as fs from 'fs';
import { readCSV } from './csvreader';

export async function checkFKConstraints(durs: DatasetUpdateRequest) {
  const eventGrammarFile = durs.dataset.eventGrammarFile;
  const grammarFile = await readCSV(eventGrammarFile);
}
