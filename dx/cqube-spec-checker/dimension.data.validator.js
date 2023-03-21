const { ValidationError } = require("./errors");

class DimensionDataValidator {
    constructor(grammarContent, dataContent) {
        this.grammarContent = grammarContent;
        this.lines = this.grammarContent.trim().split('\n');
        this.pkIndexLine = this.lines[0].trim().split(',');
        this.dataTypesLine = this.lines[1].trim().split(',');
        this.headerLine = this.lines[2].trim().split(',');
        this.dataContent = dataContent;
        this.dataContentLines = this.dataContent.trim().split('\n')[0].trim().split(',');
        this.errors = [];
    }

    verify() {
        this.verifyColumnsToGrammar();
        return this.errors;
    }

    verifyColumnsToGrammar() {
        this.headerLine.forEach((header, index) => {
            this.dataContentLines.indexOf(header) === -1 ? this.errors.push(`Missing header from grammar file: ${header}`) : null;
        });

        this.dataContentLines.forEach((header, index) => {
            this.headerLine.indexOf(header) === -1 ? this.errors.push(`Extra header not in grammar file: ${header}`) : null;
        });
    }
}

module.exports = {
    DimensionDataValidator
}
