const { ValidationError } = require("./errors");

class DimensionDataValidator {
    constructor(content) {
        this.content = content;
        this.lines = this.content.split('\n');
        this.pkIndexLine = this.lines[0].split(',');
        this.dataTypesLine = this.lines[1].split(',');
        this.headerLine = this.lines[2].split(',');
    }

    verify() {
        this.verifyColumns();
        this.verifyPkIndexLine();
        this.verifyDataTypes();
    }

    verifyColumns() {
        const columnCount = this.pkIndexLine.length;
        this.lines.forEach((line, lineNumber) => {
            const lineColumns = line.split(',').length;
            if (lineColumns !== columnCount) {
                throw new ValidationError(`Line ${lineNumber + 1}: Invalid number of columns`);
            }
        });
    }

    verifyPkIndexLine() {
        if (this.pkIndexLine[0] !== "PK" || this.pkIndexLine[1] !== "Index") {
            throw new ValidationError("Invalid PK/Index line: First row must include 'PK' and 'Index'");
        }
    }

    verifyDataTypes() {
        this.dataTypesLine.forEach((dataType, columnIndex) => {
            if (dataType !== "string" && dataType !== "integer") {
                throw new ValidationError(`Invalid data type at column ${columnIndex + 1}: Only 'string' and 'integer' are allowed`);
            }
        });
    }
}

module.exports = {
    ValidationError,
    DimensionDataValidator
}
