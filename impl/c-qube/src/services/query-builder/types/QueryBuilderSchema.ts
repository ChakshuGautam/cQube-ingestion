export class QueryBuilderSchema {
  title: string;
  psql_schema: string;
  properties: {
    [key: string]: {
      type: string;
      format?: string;
      maxLength?: number;
      unique?: boolean;
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
