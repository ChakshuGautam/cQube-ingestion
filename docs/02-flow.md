## Workflow for defining a spec

When defining a design doc, it should be done in the following order:
1. Define a KPI
2. Define a chart (optional)
3. Define a dimension
4. Define a dataset
5. Define an event
6. Define a transformer
7. Map the transformer to the event
8. Map the dataset to the transformer


#### Dimension
```json
{
    "id": "Dimension1",
    "name": "Schools",
    "type": "dynamic",
    "storage": {
        "indexes": [
            "name",
            "type"
        ],
        "primaryId": "school_id",
        "retention": null,
        "bucket_size": null
    },
    "data": {
        "school_id": 901,
        "name": "A green door",
        "type": "GSSS",
        "enrollement_count": 345,
        "district": "District",
        "block": "Block",
        "cluster": "Cluster",
        "village": "Village"
    }
}
```

#### Dataset
- This is not an automated process right now - needs to be moved to an automated things
```json
{
    "name": "attendance_school",
    "date": "2019-01-01", // This is a dimension
    "school_id": 901, // This is a dimension
    "grade": 1,
}
```

Note: `id`, `created_at`, `updated_at`, `count`, `sum`, `percentage` are all automatically added to the dataset
How do I map a dataset to a dimension?

#### Dataset Grammar
```json
{
    "schema": {
        "name": "attendance_school_grade",
        "date": "2019-01-01", // Dimension
        "grade": 1, // Addtional filterable data => indexed
        "school_id": 901, //Dimension
    },
    "dimensionMappings": [
        {
            "key": "school_id",
            "dimension": {
                "name": "Dimension1",
                "mapped_to": "Dimension1.school_id" //Optional in case of time.
            }
        },
        {
            "key": "date",
            "dimension": {
                "name": "Last 7 Days",

            }
        }

    ]
}
```
### Instruments
- Instruments can be of the following types
    - currently available instruments - `counter` ([def](https://opentelemetry.io/docs/reference/specification/metrics/api/#counter)) - allows for aggregations as `sum`, `count`, `percentage`, `min`, `max`, `avg`, `percentile`
    - pending implementations  - `meter`, `gauge`, `histogram`,


#### Event Grammar
Event grammar defines how an event will be structured (when being send to ingestion) and how it will be mapped to a processor. It includes the following:
- Schema of the event
- Mapping of the event to a transformer
- Mapping to event to a data 
- Mapping to a dimension
- Defines the field that contains the instrument

```json
{
    "name": "attendance_school_grade",
    "date": "2019-01-01", // Dimension
    "grade": 1, // Addtional filterable data => indexed
    "school_id": 901, //Dimension
}
```

#### Transformer Grammar
tranformer t(event) => dataset







