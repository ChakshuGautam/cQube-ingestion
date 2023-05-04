import {
  Dataset,
  DatasetGrammar,
  DatasetUpdateRequest,
  DimensionMapping,
  TimeDimension,
} from 'src/types/dataset';
import { Dimension, DimensionGrammar, Store } from 'src/types/dimension';
import {
  EventGrammar,
  Instrument,
  InstrumentType,
  Event,
} from 'src/types/event';

function mockDimensionMapping(
  overrides?: Partial<DimensionMapping>,
): DimensionMapping {
  return {
    key: 'defaultKey',
    dimension: {
      name: {
        name: 'defaultName',
        type: 'defaultType',
        storage: {
          indexes: [],
          primaryId: 'defaultPrimaryId',
        },
        schema: null,
      },
      mapped_to: 'defaultMappedTo',
    },
    ...overrides,
  };
}

function mockTimeDimension(overrides?: Partial<TimeDimension>): TimeDimension {
  return {
    key: 'defaultKey',
    type: 'defaultType',
    ...overrides,
  };
}

function mockDatasetGrammar(
  overrides?: Partial<DatasetGrammar>,
): DatasetGrammar {
  return {
    name: 'defaultName',
    description: 'defaultDescription',
    dimensions: [mockDimensionMapping()],
    schema: {},
    ...overrides,
  };
}

function mockDataset(overrides?: Partial<Dataset>): Dataset {
  return {
    data: {},
    spec: mockDatasetGrammar(),
    ...overrides,
  };
}

function mockDatasetUpdateRequest(
  overrides?: Partial<DatasetUpdateRequest>,
): DatasetUpdateRequest {
  return {
    dataset: mockDatasetGrammar(),
    dimensionFilter: 'defaultDimensionFilter',
    updateParams: {
      sum: 0,
      count: 0,
      avg: 0,
    },
    filterParams: {},
    ...overrides,
  };
}

function mockStore(overrides?: Partial<Store>): Store {
  return {
    indexes: [],
    primaryId: 'defaultPrimaryId',
    ...overrides,
  };
}

function mockDimensionGrammar(
  overrides?: Partial<DimensionGrammar>,
): DimensionGrammar {
  return {
    name: 'defaultName',
    type: 'defaultType',
    storage: mockStore(),
    schema: {},
    ...overrides,
  };
}

function mockDimension(overrides?: Partial<Dimension>): Dimension {
  return {
    grammar: mockDimensionGrammar(),
    data: {},
    ...overrides,
  };
}

function mockInstrument(overrides?: Partial<Instrument>): Instrument {
  return {
    type: InstrumentType.COUNTER,
    name: 'defaultName',
    ...overrides,
  };
}

function mockEventGrammar(overrides?: Partial<EventGrammar>): EventGrammar {
  return {
    name: 'defaultName',
    instrument: mockInstrument(),
    description: 'defaultDescription',
    schema: {},
    instrument_field: 'defaultInstrumentField',
    is_active: true,
    dimension: mockDimensionMapping(),
    ...overrides,
  };
}

function mockEvent(overrides?: Partial<Event>): Event {
  return {
    data: {},
    spec: mockEventGrammar(),
    ...overrides,
  };
}
