```json
{
  "event": {
    "name": "dimensions_pdata_id_total_interactions",
    "instrument": {
      "type": 0,
      "name": "counter"
    },
    "description": "",
    "instrument_field": "counter",
    "dimension": {
      "key": "",
      "dimension": {
        "name": {
          "name": "dimensions_pdata_id",
          "description": "",
          "type": "dynamic",
          "storage": {
            "indexes": ["name"],
            "primaryId": "id",
            "retention": null,
            "bucket_size": null
          },
          "schema": {
            "title": "dimensions_pdata_id",
            "psql_schema": "dimensions",
            "properties": {
              "name": {
                "type": "string",
                "unique": true
              }
            },
            "indexes": [
              {
                "columns": [["name"]]
              }
            ]
          }
        },
        "mapped_to": "dimensions_pdata_id"
      }
    },
    "is_active": true,
    "schema": {
      "properties": {
        "id": {
          "type": "string"
        }
      }
    }
  },
  "transformer": {
    "name": "passThrough",
    "suggestiveEvent": [],
    "suggestiveDataset": [],
    "isChainable": true
  },
  "dataset": {
    "name": "dimensions_pdata_id_Daily_total_interactions",
    "description": "",
    "dimensions": [
      {
        "key": "dimensions_pdata_id",
        "dimension": {
          "name": {
            "name": "dimensions_pdata_id",
            "description": "",
            "type": "dynamic",
            "storage": {
              "indexes": ["name"],
              "primaryId": "id",
              "retention": null,
              "bucket_size": null
            },
            "schema": {
              "title": "dimensions_pdata_id",
              "psql_schema": "dimensions",
              "properties": {
                "name": {
                  "type": "string",
                  "unique": true
                }
              },
              "indexes": [
                {
                  "columns": [["name"]]
                }
              ]
            }
          },
          "mapped_to": "dimensions_pdata_id"
        }
      }
    ],
    "schema": {
      "title": "dimensions_pdata_id_Daily_total_interactions",
      "psql_schema": "datasets",
      "properties": {
        "dimensions_pdata_id": {
          "type": "string"
        },
        "count": {
          "type": "number",
          "format": "float"
        },
        "sum": {
          "type": "number",
          "format": "float"
        },
        "avg": {
          "type": "number",
          "format": "float"
        }
      },
      "fk": [
        {
          "column": "dimensions_pdata_id",
          "reference": {
            "table": "dimensions.dimensions_pdata_id",
            "column": "dimensions_pdata_id"
          }
        }
      ]
    }
  }
}
```

# File Types

1. Dimension Grammar = {}-dimension.grammar.csv
2. Event Grammar = {}-event.grammar.csv
3. Dimension Data = {}-dimension.data.csv
4. Event Data = {}-event.data.csv

# Specifications

Instrument = Instrument
Instrument Type = InstrumentType

Dataset Grammar = DatasetGrammar
Dataset = Dataset
Dataset Update Request = DatasetUpdateRequest

Dimension Grammar = DimensionGrammar
Dimension Data = Dimension

Event Grammar = EventGrammar
Event Data = Event

TimeDimensions = [Day, Week, Month, Year]

Transformer Specification = Transformer
suggestive =
// PassThrough Transformer - Picks and event and create and output that can stored in a dataset

// T1 => T2 T1 will output events and T2 will output DatasetUpdateRequest

-------xxxxxx------ Bootstrapping (ingest) ------xxxxx-------

# Process CSVs to generate Dimension Grammar and Data

// dimensionGrammar
// <dimension> = school-dimension

1. Read the Config file
2. Read the Dimension Grammar
3. Valid files
4. Check Dimension Data
5. {}-dimension.grammar.csv => `DimensionGrammar`
6. DimensionGrammar => Dimension Service to persist (Prisma Model) it // Populating Table
7. Dimension Service => JSON Format
8. {}.dimension.data.csv => `Dimension[]` // Creating Table
9. Dimension => Bulk send data to Dimension Service to persist (Prisma Model) it

# Process Event

// Event Grammar => Detailed definitions of Counter(Metric) + Time Dimension (Optional) + Dimension(s)
// Event => Counter(Metric) + Time Dimension (Optional) + Dimension(s)

// Dateset => Counter(Metric) + Time Dimension (Optional) + Dimension(s)
<counter>_<one of the time dimension>_<one of the dimension>
<counter>_daily_<nCr[0]>
<counter>_weekly_<nCr[0]>
<counter>_monthly_<nCr[0]>
<counter>_yearly_<nCr[0]>
<counter>_yearly_<state,grade,subject,medium,board>

<counter>_<dimension>
<counter>_<time-dimension>_<dimension>
<counter>_<compound-dimension>
<counter>_<time-dimension>_<compound-dimension>

End Outcome

1. Define Event Grammars and persist them
   <Similar to Process CSVs to generate Dimension Grammar and Data>
2. Define What Datasets need to created and persist them + create the tables for individual datasets
   - [ ] Define which datasets need to be created
   - [ ] Event Grammar => Dataset Grammar
   - [ ] Dataset Grammar => Dataset Service to persist (Prisma Model) it crate the tables for individual datasets

-------xxxxxx------ Bootstrapping (ingest) ------xxxxx-------

-------xxxxxx------ Ingest Data ------xxxxx-------
// Event Grammars, Dataset Grammars (mapping to event grammar, mapping to dimension)

<counter>_<dimension>
<counter>_<time-dimension>_<dimension>
<counter>_<compound-dimension>
<counter>_<time-dimension>_<compound-dimension>

0. Loop over Dataset Grammars and get Event Data files {}.event.data.csv
1. `Event` => `Dataset`
2. `Dataset` ==Tranformer=> `DatasetUpdateRequest`
3. `DatasetUpdateRequest` => Dataset Service => Query builder => (Query) to persist (Prisma Model) it in bulk

persist 0. Service => Extract JSONSchema

1. JSONSchema => Query
2. Query => Executed

### Dataset Parser

![Dataset Parser](./_docs/images/cqube-dastaset-parser.jpg 'Title')
