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

The CSVs will have headers over them to given inputs for the dataset and event. The headers are as follows:
