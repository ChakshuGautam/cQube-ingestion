class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DimensionValidator {
  private content: string;
  private lines: string[];
  private pkIndexLine: string[];
  private dataTypesLine: string[];
  private headerLine: string[];

  constructor(content: string) {
    this.content = content;
    this.lines = this.content.trim().split('\n');
    this.pkIndexLine = this.lines[0].trim().split(',');
    this.dataTypesLine = this.lines[1].trim().split(',');
    this.headerLine = this.lines[2].trim().split(',');
  }

  verify() {
    const errors = [];
    errors.push(...this.verifyColumns());
    errors.push(...this.verifyPkIndexLine());
    errors.push(...this.verifyDataTypes());
    return errors;
  }

  verifyColumns() {
    const errors = [];
    const columnCount = this.pkIndexLine.length;
    this.lines.forEach((line, lineNumber) => {
      if (line !== '') {
        // Ignore last line
        const lineColumns = line.split(',').length;
        if (lineColumns !== columnCount) {
          errors.push(
            `Line ${lineNumber + 1
            }: Invalid number of columns ${lineColumns} (expected ${columnCount}), ${line.split(
              ',',
            )}`,
          );
        }
      }
    });
    return errors;
  }

  verifyPkIndexLine() {
    const errors = [];
    if (
      this.pkIndexLine.indexOf('PK') === -1 ||
      this.pkIndexLine.indexOf('Index') === -1
    ) {
      errors.push(
        `Invalid PK/Index: First row must include 'PK' and 'Index' but found "${this.pkIndexLine}"`,
      );
    }
    return errors;
  }

  verifyDataTypes() {
    const errors = [];
    this.dataTypesLine.forEach((dataType, columnIndex) => {
      if (dataType !== 'string' && dataType !== 'integer') {
        errors.push(
          `Invalid data type at column ${columnIndex + 1
          }: Only 'string' and 'integer' are allowed but found '${dataType}'`,
        );
      }
    });
    return errors;
  }
}

class DimensionDataValidator {
  private grammarContent: string;
  private lines: string[];
  private pkIndexLine;
  private dataTypesLine;
  private headerLine;
  private dataContent;
  private dataContentLines;
  private errors: any[];

  constructor(grammarContent, dataContent) {
    this.grammarContent = grammarContent;
    this.lines = this.grammarContent.trim().split('\n');
    this.pkIndexLine = this.lines[0].trim().split(',');
    this.dataTypesLine = this.lines[1].trim().split(',');
    this.headerLine = this.lines[2].trim().split(',');
    this.dataContent = dataContent;
    this.dataContentLines = this.dataContent
      .trim()
      .split('\n')[0]
      .trim()
      .split(',');
    this.errors = [];
  }

  verify() {
    this.verifyColumnsToGrammar();
    return this.errors;
  }

  verifyColumnsToGrammar() {
    this.headerLine.forEach((header, index) => {
      this.dataContentLines.indexOf(header) === -1
        ? this.errors.push(`Missing header from grammar file: ${header}`)
        : null;
    });

    this.dataContentLines.forEach((header, index) => {
      this.headerLine.indexOf(header) === -1
        ? this.errors.push(`Extra header not in grammar file: ${header}`)
        : null;
    });
  }
}
