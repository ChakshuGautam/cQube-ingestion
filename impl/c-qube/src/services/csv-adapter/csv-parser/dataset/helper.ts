import { DatasetGrammar, DimensionMapping } from '../../../../types/dataset';
import { DateParser } from './../utils/dateparser';
import {
  EventGrammar,
  InstrumentType,
  Event as cQubeEvent,
} from 'src/types/event';
import { readCSV } from '../utils/csvreader';

export const createDatasetDataToBeInserted = async (
  timeDimension: string,
  datasetGrammar: DatasetGrammar,
): Promise<cQubeEvent[]> => {
  const eventGrammar = datasetGrammar.eventGrammar;
  const dimensionMapping: DimensionMapping[] = datasetGrammar.dimensions;
  // const propertyName = await getPropertyforDatasetGrammarFromEG(eventGrammar);
  // Get all keys from datasetGrammar.schema.properties
  const propertyName = Object.keys(datasetGrammar.schema.properties)
    .filter((k) => k !== 'count')
    .filter((k) => k !== 'sum')
    .filter((k) => k !== 'date')[0];

  const filePath = eventGrammar.file.replace('grammar', 'data');

  const df = await readCSV(filePath);
  const getIndexForHeader = (headers: string[], header: string): number => {
    return headers.indexOf(header);
  };

  // Get headers
  const headers = df[0];

  // Get index for non time dimension
  const dimensionIndex = getIndexForHeader(headers, propertyName);

  // Get index for timeDimension
  const timeDimensionIndex = getIndexForHeader(headers, 'date');

  // Counter index
  const counterIndex = getIndexForHeader(
    headers,
    eventGrammar.instrument_field,
  );

  const dateParser = new DateParser('dd/MM/yy');

  const datasetEvents: cQubeEvent[] = [];
  for (let row = 1; row < df.length - 1; row++) {
    const rowData = df[row];
    try {
      const rowObject = {};
      rowObject[eventGrammar.instrument_field] = parseInt(
        rowData[counterIndex],
      );
      rowObject[propertyName] = rowData[dimensionIndex];
      // rowObject[eventGrammars.dimension.dimension.name.name] =
      // rowData[dimenstionIndex];
      if (timeDimensionIndex > -1) {
        const date = dateParser.parseDate(rowData[timeDimensionIndex]);
        if (timeDimension === 'Daily') {
          rowObject['date'] = date;
        } else if (timeDimension === 'Weekly') {
          rowObject['week'] = DateParser.getWeek(date);
          rowObject['year'] = DateParser.getYear(date);
        } else if (timeDimension === 'Monthly') {
          rowObject['month'] = DateParser.getMonth(date);
          rowObject['year'] = DateParser.getYear(date);
        } else if (timeDimension === 'Yearly') {
          rowObject['year'] = DateParser.getYear(date);
        }
      }
      datasetEvents.push({ data: rowObject, spec: eventGrammar });
    } catch (e) {
      console.error('Wrong datapoint', rowData, filePath);
    }
  }
  return datasetEvents;

  // remove all columns except propertyName, timeDimension, and dimension.
  // Add a timeDimension column based on the date of the event.
  // new column name is date, week, month or year depending on the selected timeDimension
};

export const createCompoundDatasetDataToBeInserted = async (
  eventFilePath: string,
  eventGrammar: EventGrammar,
  datasetGrammar: DatasetGrammar,
): Promise<cQubeEvent[]> => {
  const dimensionMapping: DimensionMapping[] = [];
  dimensionMapping.push(eventGrammar.dimension[0]);
  const properties = datasetGrammar.schema.properties;
  delete properties.date;
  delete properties.avg;
  delete properties.sum;
  delete properties.count;
  delete properties.year;

  const df = await readCSV(eventFilePath);

  const getIndexForHeader = (headers: string[], header: string): number => {
    return headers.indexOf(header);
  };

  // Get headers
  const headers = df[0];

  // Get index for timeDimension
  const timeDimensionIndex = getIndexForHeader(headers, 'date');

  // Counter index
  const counterIndex = getIndexForHeader(
    headers,
    eventGrammar.instrument_field,
  );

  const datasetEvents: cQubeEvent[] = [];
  const dateParser = new DateParser('dd/MM/yy');

  for (let row = 1; row < df.length - 1; row++) {
    const rowData = df[row];
    try {
      const rowObject = {};
      rowObject[eventGrammar.instrument_field] = parseInt(
        rowData[counterIndex],
      );
      for (const property in properties) {
        // TODO: Fix this hack
        const dimensionIndex = getIndexForHeader(headers, property);
        rowObject[property] = rowData[dimensionIndex];
      }
      if (datasetGrammar.timeDimension) {
        const date = dateParser.parseDate(rowData[timeDimensionIndex]);
        if (datasetGrammar.timeDimension.type === 'Daily') {
          rowObject['date'] = date;
        } else if (datasetGrammar.timeDimension.type === 'Weekly') {
          rowObject['week'] = DateParser.getWeek(date);
          rowObject['year'] = DateParser.getYear(date);
        } else if (datasetGrammar.timeDimension.type === 'Monthly') {
          rowObject['month'] = DateParser.getMonth(date);
          rowObject['year'] = DateParser.getYear(date);
        } else if (datasetGrammar.timeDimension.type === 'Yearly') {
          rowObject['year'] = DateParser.getYear(date);
        }
      }
      datasetEvents.push({ data: rowObject, spec: eventGrammar });
    } catch (e) {
      console.error('Wrong datapoint', rowData, eventFilePath);
    }
  }
  return datasetEvents;

  // remove all columns except propertyName, timeDimension, and dimension.
  // Add a timeDimension column based on the date of the event.
  // new column name is date, week, month or year depending on the selected timeDimension
};
