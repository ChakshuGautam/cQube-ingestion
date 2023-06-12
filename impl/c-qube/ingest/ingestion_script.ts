import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';

// Function to read the config.json file and extract the quoteChar parameter
function getQuoteCharFromConfig(): string | undefined {
  try {
    const configFile = fs.readFileSync('config.json', 'utf8');
    const config = JSON.parse(configFile);
    const quoteChar = config.globals?.quoteChar;

    return quoteChar;
  } catch (error) {
    console.error('Error reading config.json:', error.message);
    return undefined;
  }
}

// Function to run the ingestion process with the extracted quoteChar parameter
// Function to run the ingestion process with the extracted quoteChar parameter and sample data
function runIngestionProcess(quoteChar: string | undefined) {
  // Sample data
  const sampleData = [
    {
      state: 'value1',
      grade: 'value2',
      subject: 'value3',
      medium: 'value4',
      board: 'value5'
    },
    {
      state: 'value6',
      grade: 'value7',
      subject: 'value8',
      medium: 'value9',
      board: 'value10'
    }
  ];

  // Process the sample data with the quoteChar parameter
  if (quoteChar) {
    // Apply the quoteChar to each field in the sample data
    const processedData = sampleData.map((row) => {
      const processedRow: Record<string, string> = {};
      for (const field in row) {
        processedRow[field] = `${quoteChar}${row[field]}${quoteChar}`;
      }
      return processedRow;
    });

    // Perform the ingestion process with the processed data
    console.log('Running ingestion process with quoteChar:', quoteChar);
    console.log('Processed data:', processedData);

    // Example ingestion logic: Print each processed row
    processedData.forEach((row) => {
      console.log('Ingesting data:', row);
      // TODO: Replace with your actual ingestion logic here
    });

    
    const outputPath = './output/processed_data.csv';
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: Object.keys(processedData[0])
    });
    csvWriter.writeRecords(processedData)
      .then(() => console.log(`Processed data saved to ${outputPath}.`))
      .catch((err) => console.error('Error saving processed data:', err));
  } else {
    console.log('Error: quoteChar parameter not found in the configuration file.');
  }
}

// Rest of the script...


// Entry point
const quoteChar = getQuoteCharFromConfig();
runIngestionProcess(quoteChar);