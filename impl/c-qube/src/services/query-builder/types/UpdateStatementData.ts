export class UpdateStatementData {
  properties: {
    [k: string]: string;
  };
  conditions: {
    [k: string]: {
      operator: string;
      type: string;
      value: string;
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
