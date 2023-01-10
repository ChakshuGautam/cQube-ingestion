import { Test, TestingModule } from '@nestjs/testing';
import { JSONSchema4 } from 'json-schema';
import { QueryBuilderService } from './query-builder.service';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);
  });

  it('generates a create statement with a single integer column', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        id: { type: 'integer' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe('CREATE TABLE my_table (\n  id integer\n);');
  });

  it('generates a create statement with a single string column', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        name: { type: 'string' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe('CREATE TABLE my_table (\n  name string\n);');
  });

  it('generates a create statement with a string column with a max length', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        name: { type: 'string', maxLength: 255 },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      'CREATE TABLE my_table (\n  name string(255)\n);',
    );
  });

  it('generates a create statement with multiple columns with Timestamps', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      'CREATE TABLE my_table (\n  id integer,\n  name string(255),\n  date_created TIMESTAMP\n);',
    );
  });
});
