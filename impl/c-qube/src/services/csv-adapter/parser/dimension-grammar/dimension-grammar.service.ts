import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import {
  getDimensionColumns,
  getDimensionNameFromFilePath,
  getPrimaryKeyAndIndexes,
  isValidCSVFormat,
} from './dimension-grammar.helpers';
import { DimensionGrammar } from 'src/types/dimension';
import { Column } from '../../types/parser';

@Injectable()
export class DimensionGrammarService {
  private readonly logger: Logger = new Logger(DimensionGrammarService.name);
  async createDimensionGrammarFromCSVDefinition(
    csvFilePath: string,
  ): Promise<DimensionGrammar | null> {
    const fileContent = await fs.readFile(csvFilePath, 'utf-8');
    const [row1, row2, row3] = fileContent.split('\n').map((row) => row.trim());

    if (!isValidCSVFormat(row1, row2, row3)) {
      this.logger.error(
        `Invalid CSV format for dimension grammar file: ${csvFilePath}`,
      );
      return null;
    }

    const dimensionName = getDimensionNameFromFilePath(csvFilePath);
    const { pk, indexes } = getPrimaryKeyAndIndexes(row1, row3);
    const dimensionColumns = getDimensionColumns(row2, row3);

    const dimensionGrammar = this.createCompositeDimensionGrammar(
      dimensionColumns,
      dimensionName,
      pk,
      indexes,
    );

    return dimensionGrammar;
  }

  createCompositeDimensionGrammar(
    dimensionColumns: Column[],
    name: string,
    primaryId: string,
    indexes: string[],
  ): DimensionGrammar {
    const properties = {};
    for (let i = 0; i < dimensionColumns.length; i++) {
      properties[dimensionColumns[i].name] = {
        type: dimensionColumns[i].type,
        unique:
          indexes.indexOf(dimensionColumns[i].name) > -1 ||
          dimensionColumns[i].name === primaryId,
      };
    }

    return {
      name: name,
      description: '',
      type: 'dynamic',
      storage: {
        indexes: ['name'],
        primaryId: primaryId,
        retention: null,
        bucket_size: null,
      },
      schema: {
        title: name,
        psql_schema: 'dimensions',
        properties,
        indexes: [{ columns: [indexes.map((i) => i)] }],
      },
    } as DimensionGrammar;
  }
}
