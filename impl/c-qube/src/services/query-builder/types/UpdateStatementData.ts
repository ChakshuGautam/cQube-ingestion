export class UpdateStatementData {
  properties: {
    [k: string]: {
      type: string;
      value: string | number | boolean;
      format?: string;
    };
  };
  conditions: {
    [k: string]: {
      operator: string;
      type: string;
      value: string | number | boolean;
    };
  };
}

/**
const example = {
  properties: {
    isAdult: 'Y',
  },
  conditions: {
    age: '>=18'
  }
}
 */
