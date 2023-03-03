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

  // async createEvent(
  //   eventGrammar: EventGrammar,
  //   autoPrimaryKey = true,
  // ): Promise<void> {
  //   const createQuery = this.qbService.generateCreateStatement(
  //     eventGrammar.schema,
  //     autoPrimaryKey,
  //   );
  //   console.log(createQuery);
  //   console.log('------');
  //   await this.prisma.$queryRawUnsafe(createQuery);
  // }

  async createEventGrammar(eventGrammar: EventGrammar): Promise<EventGrammar> {
    const dimensionGrammar: DimensionGrammarModel =
      await this.dimensionService.getDimensionGrammaModelByName(
        eventGrammar.dimension[0].dimension.name.name,
      );
    return this.prisma.eventGrammar
      .create({
        data: {
          name: eventGrammar.name,
          description: eventGrammar.description,
          schema: eventGrammar.schema,
          instrumentField: eventGrammar.instrument_field,
          isActive: eventGrammar.is_active,
          dimensionMapping: JSON.stringify([
            {
              key: eventGrammar.dimension[0].key,
              dimension: {
                name: dimensionGrammar.id,
                mapped_to: eventGrammar.dimension[0].dimension.mapped_to,
              },
            },
          ]),
          instrument: {
            connect: {
              name: 'COUNTER', //TODO: Change this to eventGrammar.instrument.name
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
