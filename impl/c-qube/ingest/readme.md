### Ingesting Grammar
- Dimension Grammar CSVs - `cluster-dimenstion.grammar.csv`
- Event Grammar CSVs - `cluster-event.grammar.csv`

### Ingesting Data
- Dimension Data CSVs - `cluster-dimenstion.data.csv`
- Event Data CSVs - `cluster-event.data.csv`

### Ingestion
```bash
yarn cli ingest-schema
```

### Nuking the DB
Since this would be iterative process, there would be a lot of changes to the schema. To nuke the DB and start afresh, run the following command:
```bash
yarn cli nuke-db
```


### Ingestion Specification
```json
{
  "programs": [
    {
      "name": "Review and Monitoring",
      "description": "Review and Monitoring",
      "shouldIngestToDB": true,
      "input": {
        "files": "ingest/rev-and-monitor"
      },
      "output": {
        "location": "output/rev-and-monitor"
      }
    }
  ]
}
```