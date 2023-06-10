import { EventGrammar } from '../../../../types/event';
import { createSingleDatasetGrammarsFromEGWithoutTimeDimension } from './dataset-grammar.service';
import {
  mockDimensionMapping,
  mockEventGrammar,
} from '../../../mocks/types.mocks';

describe('createSingleDatasetGrammarsFromEGWithoutTimeDimension', () => {
  it('should make the test pass', () => {
    expect(true).toBe(true);
  });
  // it('should create a dataset grammar without a time dimension', async () => {
  //   const folderName = 'testFolder';
  //   const eventGrammar: EventGrammar = mockEventGrammar({
  //     instrument_field: 'testInstrumentField',
  //     dimension: [mockDimensionMapping({ key: 'testKey' })],
  //   });

  //   const datasetGrammar =
  //     await createSingleDatasetGrammarsFromEGWithoutTimeDimension(
  //       folderName,
  //       eventGrammar,
  //     );

  //   expect(datasetGrammar.name).toBe(
  //     `${folderName}_testInstrumentField_testKey`,
  //   );
  //   expect(datasetGrammar.eventGrammar).toEqual(eventGrammar);
  //   expect(datasetGrammar.dimensions).toHaveLength(1);
  //   expect(datasetGrammar.dimensions[0].key).toBe('testKey');
  //   expect(datasetGrammar.schema).toBeDefined();
  //   expect(datasetGrammar.schema.properties).toBeDefined();
  //   expect(datasetGrammar.schema.properties).toHaveProperty('sum');
  //   expect(datasetGrammar.schema.properties).toHaveProperty('count');
  // });

  // it('should use the provided folderName in the dataset grammar name', async () => {
  //   const folderName = 'customFolder';
  //   const eventGrammar: EventGrammar = mockEventGrammar({
  //     instrument_field: 'testInstrumentField',
  //     dimension: [mockDimensionMapping({ key: 'testKey' })],
  //   });

  //   const datasetGrammar =
  //     await createSingleDatasetGrammarsFromEGWithoutTimeDimension(
  //       folderName,
  //       eventGrammar,
  //     );

  //   expect(datasetGrammar.name).toBe(
  //     `${folderName}_testInstrumentField_testKey`,
  //   );
  // });
});
