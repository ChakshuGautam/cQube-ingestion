import { Injectable } from '@nestjs/common';
import { InstrumentType } from 'src/types/event';
import { InstrumentType as InstrumentTypeModel } from '@prisma/client';

import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

@Injectable()
export class InstrumenttypeService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
  ) {
    this.createDefaultInstrumentType();
  }

  // insert a default instrument type
  async createDefaultInstrumentType(): Promise<InstrumentTypeModel> {
    if ((await this.prisma.instrumentType.findMany()).length > 0) {
      return this.prisma.instrumentType.findFirst();
    } else {
      return this.prisma.instrumentType.create({
        data: {
          name: 'COUNTER',
        },
      });
    }
  }

  getInstrumentTypeByName(
    instrumentName: string,
  ): Promise<InstrumentTypeModel> {
    return this.prisma.instrumentType.findUnique({
      where: {
        name: instrumentName,
      },
    });
  }
}
