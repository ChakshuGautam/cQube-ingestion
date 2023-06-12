const fs = require('fs');

// Define the test data.This is sample data
const testData = [
  { district: 'New York', value: 10 },
  { district: 'new york', value: 20 },
  { district: 'NEW YORK', value: 30 },
];

// Write the test data to a CSV file
const csvData = testData.map(({ district, value }) => `${district},${value}`).join('\n');
fs.writeFileSync('test_data.csv', csvData);

// Simulate the ingestion process
function simulateDataIngestion() {
  const data = fs.readFileSync('test_data.csv', 'utf8');

  const rows = data.trim().split('\n');

  const caseSensitiveFKSearch = false; 
  for (const row of rows) {
    const [district, value] = row.split(',');

    // Perform FK matching with case sensitivity control
    const matchingDistrict = caseSensitiveFKSearch
      ? testData.find((item) => item.district === district)
      : testData.find((item) => item.district.toLowerCase() === district.toLowerCase());

    if (matchingDistrict) {
      // FK match found, continue with data ingestion
      console.log(`Ingesting data: District: ${matchingDistrict.district}, Value: ${value}`);
      // Perform data ingestion logic here
    } else {
      console.log(`Ignoring data: District not found: ${district}`);
      // Handle FK mismatch or logging logic here
    }
  }
}

// Run the data ingestion simulation
simulateDataIngestion();