export class QueryBuilderSchema {
  title: string;
  psql_schema: string;
  properties: {
    [key: string]: {
      type: string;
      format?: string;
      description?: string;
      enum?: string[];
      fk?: {
        table: string;
        column?: string;
      };
    };
  };
  fk?: {
    column: string;
    reference: {
      table: string;
      column: string;
    };
  }[];
}
