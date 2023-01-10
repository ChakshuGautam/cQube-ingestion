import { Injectable } from '@nestjs/common';
import { DimensionGrammar } from 'src/types/dimension';

@Injectable()
export class DimensionService {
  constructor() {}

  createDimensionGrammar(
    dimensionGrammar: DimensionGrammar,
  ): Promise<DimensionGrammar> {
    return Promise.resolve(dimensionGrammar);
  }

  getDimensionGrammar(dimensionId: string): Promise<DimensionGrammar | null> {
    return Promise.resolve(null);
  }

  getDimensionGrammarByName(name: string): Promise<DimensionGrammar | null> {
    return Promise.resolve(null);
  }
}
