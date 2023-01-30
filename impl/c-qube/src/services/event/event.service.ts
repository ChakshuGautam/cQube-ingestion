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
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

@Injectable()
export class EventService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
  ) {}

  dbModelToEventGrammar(model: EventGrammarModel): EventGrammar {
    return {
      name: model.name,
      instrument: model.instrumentType as unknown as Instrument,
      description: model.description,
      schema: model.schema as object,
      instrument_field: model.instrumentField,
      is_active: model.isActive,
    };
  }

  async createEventGrammar(EventGrammar: EventGrammar): Promise<EventGrammar> {
    return this.prisma.eventGrammar
      .create({
        data: {
          name: EventGrammar.name,
          description: EventGrammar.description,
          schema: EventGrammar.schema,
          instrumentField: EventGrammar.instrument_field,
          isActive: EventGrammar.is_active,
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

  async createEvent(
    EventGrammar: EventGrammar,
    autoPrimaryKey = true,
  ): Promise<void> {
    const createQuery = this.qbService.generateCreateStatement(
      EventGrammar.schema,
      autoPrimaryKey,
    );
    const indexQuery: string[] = this.qbService.generateIndexStatement(
      EventGrammar.schema,
    );
    await this.prisma.$queryRawUnsafe(createQuery);

    // iterate over indexQuery and execute each query
    for (const query of indexQuery) {
      await this.prisma.$queryRawUnsafe(query);
    }
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
