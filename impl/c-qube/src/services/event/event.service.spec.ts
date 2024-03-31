import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { EventService } from './event.service';
import { mockDimensionGrammar, mockEventGrammar } from '../mocks/types.mocks';
import {
  EventGrammar as EventGrammarModel,
  InstrumentType as InstrumentTypeModel,
  DimensionGrammar as DimensionGrammarModel,
} from '@prisma/client';

console.error = jest.fn();
describe('EventService', () => {
  let service: EventService;
  let prismaService: PrismaService;
  let qbService: QueryBuilderService;
  let dimensionService: DimensionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        PrismaService,
        QueryBuilderService,
        DimensionService,
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    prismaService = module.get<PrismaService>(PrismaService);
    qbService = module.get<QueryBuilderService>(QueryBuilderService);
    dimensionService = module.get<DimensionService>(DimensionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call generateInsertStatement with the correct parameters', async () => {
    jest.spyOn(qbService, 'generateInsertStatement').mockReturnValue('INSERT QUERY');
    const data = { field1: 'value1', field2: 'value2' };
    await service.processEventData(mockEventGrammar(), data);
    expect(qbService.generateInsertStatement).toHaveBeenCalledWith(mockEventGrammar().schema, data);
  });

  it('should return the EventGrammar when event grammar with specified dimensionId exists', async () => {
    const dimensionId = 1;
    jest.spyOn(service, 'dbModelToEventGrammar').mockResolvedValue(mockEventGrammar());
    const result = await service.getEventGrammar(dimensionId);
    expect(result).toEqual(mockEventGrammar());
  });

  it('should return the EventGrammar when event grammar with specified name exists', async () => {
    const eventName = 'TestEventGrammar';
    jest.spyOn(service, 'dbModelToEventGrammar').mockResolvedValue(mockEventGrammar());
    const result = await service.getEventGrammarByName(eventName);
    expect(result).toEqual(mockEventGrammar());
  });
  
});
