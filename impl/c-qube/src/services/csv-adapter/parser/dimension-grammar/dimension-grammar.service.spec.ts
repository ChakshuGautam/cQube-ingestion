import { Test, TestingModule } from '@nestjs/testing';
import { DimensionGrammarService } from './dimension-grammar.service';
import { promises as fsMock } from 'fs';
import {
  getDimensionColumns,
  getDimensionNameFromFilePath,
  getPrimaryKeyAndIndexes,
} from './dimension-grammar.helpers';
import { Column, ColumnType } from '../../types/parser';

const mockReadFile = async (
  path: string,
  encoding: string,
): Promise<string> => {
  if (path === 'invalid-dimension.grammar.csv') return ``;
  if (path === 'incorrect-length.grammar.csv')
    return `PK,,,,,,,,,,
  string,string,string,string,string,string,string,string,string,string
  school_id,school_name,schoolcategory_id,cluster_id,cluster_name,block_id,block_name,district_id,district_name,latitude,longitude`;
  return `PK,,,,,,,,,,
  string,string,string,string,string,string,string,string,string,string,string
  school_id,school_name,schoolcategory_id,cluster_id,cluster_name,block_id,block_name,district_id,district_name,latitude,longitude`;
};

describe('DimensionGrammarService', () => {
  let service: DimensionGrammarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DimensionGrammarService],
    }).compile();

    service = module.get<DimensionGrammarService>(DimensionGrammarService);
  });

  it('should create a DimensionGrammar from CSV definition', async () => {
    // Override the default 'fs.readFile' method with the mock
    (fsMock.readFile as any) = mockReadFile;

    const dimensionGrammar =
      await service.createDimensionGrammarFromCSVDefinition(
        'school-dimension.grammar.csv',
      );

    expect(dimensionGrammar.name).toEqual('school');
    expect(dimensionGrammar.storage.primaryId).toEqual('school_id');
    expect(dimensionGrammar.storage.indexes).toEqual(['name']);
    expect(dimensionGrammar.schema.properties['school_name'].type).toEqual(
      'string',
    );
    expect(dimensionGrammar.schema.properties['school_name'].unique).toEqual(
      false,
    );
    expect(dimensionGrammar.schema.properties['school_id'].unique).toEqual(
      true,
    );
  });
  describe('createDimensionGrammarFromCSVDefinition', () => {
    it('should create a DimensionGrammar from CSV definition', async () => {
      const dimensionGrammar =
        await service.createDimensionGrammarFromCSVDefinition(
          'school-dimension.grammar.csv',
        );

      expect(dimensionGrammar.name).toBe('school');
      expect(dimensionGrammar.storage.primaryId).toBe('school_id');
      expect(dimensionGrammar.storage.indexes).toEqual(['name']);
      expect(dimensionGrammar.schema.properties['school_name'].type).toBe(
        'string',
      );
      expect(dimensionGrammar.schema.properties['school_name'].unique).toBe(
        false,
      );
      expect(dimensionGrammar.schema.properties['school_id'].unique).toBe(true);
    });

    it('should return null when CSV format is invalid', async () => {
      const dimensionGrammar =
        await service.createDimensionGrammarFromCSVDefinition(
          'invalid-dimension.grammar.csv',
        );

      expect(dimensionGrammar).toBeNull();
    });

    it('should return null when CSV format is invalid - incorrect length of columns', async () => {
      const dimensionGrammar =
        await service.createDimensionGrammarFromCSVDefinition(
          'incorrect-length.grammar.csv',
        );

      expect(dimensionGrammar).toBeNull();
    });
  });

  describe('getDimensionNameFromFilePath', () => {
    it('should get the dimension name from a file path', () => {
      const dimensionName = getDimensionNameFromFilePath(
        'path/to/school-dimension.grammar.csv',
      );

      expect(dimensionName).toBe('school');
    });
  });

  describe('getPrimaryKeyAndIndexes', () => {
    it('should get the primary key and indexes from row1 and row3', () => {
      const row1 = 'PK,,,,,,,';
      const row3 =
        'school_id,school_name,schoolcategory_id,cluster_id,cluster_name,block_id,block_name,district_id,district_name,latitude,longitude';

      const { pk, indexes } = getPrimaryKeyAndIndexes(row1, row3);

      expect(pk).toBe('school_id');
      expect(indexes).toEqual([]);
    });
  });

  describe('getDimensionColumns', () => {
    it('should get the dimension columns from row2 and row3', () => {
      const row2 =
        'string,string,string,string,string,string,string,string,string,string,string';
      const row3 =
        'school_id,school_name,schoolcategory_id,cluster_id,cluster_name,block_id,block_name,district_id,district_name,latitude,longitude';

      const dimensionColumns = getDimensionColumns(row2, row3);

      expect(dimensionColumns.length).toBe(11);
      expect(dimensionColumns[0]).toEqual({
        name: 'school_id',
        type: ColumnType.string,
      });
      expect(dimensionColumns[1]).toEqual({
        name: 'school_name',
        type: ColumnType.string,
      });
    });
  });

  describe('createCompositeDimensionGrammar', () => {
    it('should create a composite dimension grammar', () => {
      const dimensionColumns: Column[] = [
        { name: 'school_id', type: ColumnType.string },
        { name: 'school_name', type: ColumnType.string },
      ];
      const name = 'school';
      const primaryId = 'school_id';
      const indexes: string[] = [];

      const dimensionGrammar = service.createCompositeDimensionGrammar(
        dimensionColumns,
        name,
        primaryId,
        indexes,
      );

      expect(dimensionGrammar.name).toBe('school');
      expect(dimensionGrammar.storage.primaryId).toBe('school_id');
      expect(dimensionGrammar.storage.indexes).toEqual(['name']);
      expect(dimensionGrammar.schema.properties['school_name'].type).toBe(
        'string',
      );
      expect(dimensionGrammar.schema.properties['school_name'].unique).toBe(
        false,
      );
      expect(dimensionGrammar.schema.properties['school_id'].unique).toBe(true);
    });
  });
});
