import { Instrument, InstrumentType } from '../../types/event';
import { mockDataset, mockDatasetGrammar, mockDatasetUpdateRequest, mockDimension, mockDimensionMapping, mockEvent, mockTimeDimension } from './types.mocks';

describe('mockEvent', () => {
  it('should create a mocked Event object', () => {
    const mockInstrument: Instrument = {
      type: InstrumentType.COUNTER,
      name: 'testInstrument',
    };
    const event = mockEvent({ spec: {
      instrument: mockInstrument,
      name: 'defaultName',
      description: 'defaultDescription',
      schema: {},
      instrument_field: 'defaultInstrumentField',
      is_active: true,
      dimension: {
        key: 'defaultKey',
        dimension: {
          name: {
            name: 'defaultName',
            type: 'defaultType',
            storage: { indexes: [], primaryId: 'defaultPrimaryId' },
            schema: null,
          },
          mapped_to: 'defaultMappedTo',
        },
      }
    } });
    expect(event.data).toEqual({});
    expect(event.spec.name).toBe('defaultName');
    expect(event.spec.instrument).toEqual(mockInstrument);
    expect(event.spec.description).toBe('defaultDescription');
    expect(event.spec.schema).toEqual({});
    expect(event.spec.instrument_field).toBe('defaultInstrumentField');
    expect(event.spec.is_active).toBe(true);
    expect(event.spec.dimension).toEqual({
      key: 'defaultKey',
      dimension: {
        name: {
          name: 'defaultName',
          type: 'defaultType',
          storage: { indexes: [], primaryId: 'defaultPrimaryId' },
          schema: null,
        },
        mapped_to: 'defaultMappedTo',
      },
    });
  });

  it('should create a mocked DimensionMapping object', () => {
    const dimensionMapping = mockDimensionMapping();
    expect(dimensionMapping.key).toBe('defaultKey');
    expect(dimensionMapping.dimension.name.name).toBe('defaultName');
    expect(dimensionMapping.dimension.name.type).toBe('defaultType');
    expect(dimensionMapping.dimension.name.storage.indexes).toEqual([]);
    expect(dimensionMapping.dimension.name.storage.primaryId).toBe('defaultPrimaryId');
    expect(dimensionMapping.dimension.mapped_to).toBe('defaultMappedTo');
  });

  it('should override properties in the mocked DimensionMapping object', () => {
    const dimensionMapping = mockDimensionMapping({ key: 'customKey', dimension: {
      mapped_to: 'customMappedTo',
      name: undefined
    } });
    expect(dimensionMapping.key).toBe('customKey');
    expect(dimensionMapping.dimension.mapped_to).toBe('customMappedTo');
  });

  it('should create a mocked TimeDimension object', () => {
    const timeDimension = mockTimeDimension();
    expect(timeDimension.key).toBe('defaultKey');
    expect(timeDimension.type).toBe('defaultType');
  });

  it('should override properties in the mocked TimeDimension object', () => {
    const timeDimension = mockTimeDimension({ key: 'customKey', type: 'customType' });
    expect(timeDimension.key).toBe('customKey');
    expect(timeDimension.type).toBe('customType');
  });

  it('should create a mocked DatasetGrammar object', () => {
    const datasetGrammar = mockDatasetGrammar();
    expect(datasetGrammar.name).toBe('defaultName');
    expect(datasetGrammar.description).toBe('defaultDescription');
    expect(datasetGrammar.dimensions.length).toBe(1);
    expect(datasetGrammar.schema).toEqual({});
  });

  it('should override properties in the mocked DatasetGrammar object', () => {
    const datasetGrammar = mockDatasetGrammar({ name: 'customName', description: 'customDescription' });
    expect(datasetGrammar.name).toBe('customName');
    expect(datasetGrammar.description).toBe('customDescription');
  });

  it('should create a mocked Dataset object', () => {
    const dataset = mockDataset();
    expect(dataset.data).toEqual({});
    expect(dataset.spec.name).toBe('defaultName');
    expect(dataset.spec.dimensions.length).toBe(1);
    expect(dataset.spec.schema).toEqual({});
  });

  it('should override properties in the mocked Dataset object', () => {
    const dataset = mockDataset({ data: { key: 'value' } });
    expect(dataset.data).toEqual({ key: 'value' });
  });

  it('should create a mocked DatasetUpdateRequest object', () => {
    const datasetUpdateRequest = mockDatasetUpdateRequest();
    expect(datasetUpdateRequest.dataset.name).toBe('defaultName');
    expect(datasetUpdateRequest.dimensionFilter).toBe('defaultDimensionFilter');
    expect(datasetUpdateRequest.updateParams).toEqual({ sum: 0, count: 0, avg: 0 });
    expect(datasetUpdateRequest.filterParams).toEqual({});
  });

  it('should override properties in the mocked DatasetUpdateRequest object', () => {
    const datasetUpdateRequest = mockDatasetUpdateRequest({ dimensionFilter: 'customFilter' });
    expect(datasetUpdateRequest.dimensionFilter).toBe('customFilter');
  });

  it('should create a mocked Dimension object', () => {
    const dimension = mockDimension();
    expect(dimension.data).toEqual({});
    expect(dimension.grammar.name).toBe('defaultName');
    expect(dimension.grammar.type).toBe('defaultType');
    expect(dimension.grammar.storage.indexes).toEqual([]);
    expect(dimension.grammar.storage.primaryId).toBe('defaultPrimaryId');
    expect(dimension.grammar.schema).toEqual({});
  });
});