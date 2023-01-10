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

  it('generates a create statement with a single float column', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        id: { type: 'number', format: 'float' },
      },
      indexes: [
        {
          name: 'my_table_id_idx',
          columns: ['id'],
        },
      ],
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe('CREATE TABLE my_table (\n  id FLOAT8\n);');
  });

  it('generates a create statement with a single double column', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        id: { type: 'number', format: 'double' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe('CREATE TABLE my_table (\n  id FLOAT8\n);');
  });

  it('generates an index statement for each index defined in the schema', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [{ columns: [['name']] }, { columns: [['date_created']] }],
    };
    const indexStatements = service.generateIndexStatement(
      jsonSchema as JSONSchema4,
    );
    const expectedStatements = `CREATE INDEX my_table_name_idx ON my_table (name);\nCREATE INDEX my_table_date_created_idx ON my_table (date_created);\n`;
    expect(indexStatements).toBe(expectedStatements);
  });

  it('generates an index statement for each index defined in the schema', () => {
    const jsonSchema = {
      title: 'my_table',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const indexStatements = service.generateIndexStatement(
      jsonSchema as JSONSchema4,
    );
    const expectedStatements = `CREATE INDEX my_table_name_date_created_idx ON my_table (name, date_created);\nCREATE INDEX my_table_name_idx ON my_table (name);\nCREATE INDEX my_table_date_created_idx ON my_table (date_created);\n`;
    expect(indexStatements).toBe(expectedStatements);
  });
});
