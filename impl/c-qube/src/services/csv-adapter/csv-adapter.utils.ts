import { getEGDefFromFile } from './parser/event-grammar/event-grammar.service';
import { EventGrammarCSVFormat, FieldType } from './types/parser';

export function getDGDefsFromEGDefs(eventGrammarDef: EventGrammarCSVFormat[]) {
  return eventGrammarDef.filter(
    (value) => value.fieldType === FieldType.dimension,
  );
}

export async function isTimeDimensionPresent(csvFilePath: string) {
  const {
    eventGrammarDef,
  }: {
    eventGrammarDef: EventGrammarCSVFormat[];
    instrumentField: string;
  } = await getEGDefFromFile(csvFilePath);

  //TODO Fix this - assumes the first column to be date.
  for (let i = 0; i < eventGrammarDef.length; i++) {
    if (eventGrammarDef[i].fieldType === 'timeDimension') {
      return true;
    } else {
      return false;
    }
  }
}
