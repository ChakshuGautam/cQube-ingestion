import { Injectable } from '@nestjs/common';
import {
  InstrumentType,
  Instrument,
  Event,
  EventGrammar,
} from 'src/types/event';
import {
  EventGrammar as EventGrammarModel,
  InstrumentType as InstrumentTypeModel,
  DimensionGrammar as DimensionGrammarModel,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DimensionService } from '../dimension/dimension.service';

@Injectable()
export class EventService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
    private dimensionService: DimensionService,
  ) {}

  dbModelToEventGrammar(model: EventGrammarModel): EventGrammar {
    // Get DimensionGrammar from DimensionGrammarSpec Table
    // Change the dimension field Name to dimensionGrammar
    return {
      name: model.name,
      instrument: model.instrumentType as unknown as Instrument,
      description: model.description,
      schema: model.schema as object,
      instrument_field: model.instrumentField,
      is_active: model.isActive,
      dimension: null,
    };
  }

  async createEventGrammar(EventGrammar: EventGrammar): Promise<EventGrammar> {
    const dimensionGrammar: DimensionGrammarModel =
      await this.dimensionService.getDimensionGrammaModelByName(
        EventGrammar.dimension.dimension.name.name,
      );
    return this.prisma.eventGrammar
      .create({
        data: {
          name: EventGrammar.name,
          description: EventGrammar.description,
          schema: EventGrammar.schema,
          instrumentField: EventGrammar.instrument_field,
          isActive: EventGrammar.is_active,
          dimensionMapping: JSON.stringify({
            key: EventGrammar.dimension.key,
            dimension: {
              name: dimensionGrammar.id,
              mapped_to: EventGrammar.dimension.dimension.mapped_to,
            },
          }),
          instrument: {
            connect: {
              name: EventGrammar.instrument.name,
            },
          },
        },
      })
      .then((model: EventGrammarModel) => this.dbModelToEventGrammar(model));
  }

  async getEventGrammar(dimensionId: number): Promise<EventGrammar | null> {
    return this.prisma.eventGrammar
      .findUnique({
        where: {
          id: dimensionId,
        },
      })
      .then((model: EventGrammarModel) => this.dbModelToEventGrammar(model));
  }

  async getEventGrammarByName(name: string): Promise<EventGrammar | null> {
    return this.prisma.eventGrammar
      .findFirst({
        where: {
          name: name,
        },
      })
      .then((model: EventGrammarModel) => this.dbModelToEventGrammar(model));
  }

  async processEventData(EventGrammar: EventGrammar, data): Promise<void> {
    const insertQuery = this.qbService.generateInsertStatement(
      EventGrammar.schema,
      data,
    );
    return null;
  }

  async processBulkEventData(
    EventGrammar: EventGrammar,
    data: any[],
  ): Promise<void> {
    return null;
  }
}
