## Workflow for defining a spec

When defining a design doc, it should be done in the following order:

1. Define a KPI
2. Define a chart (optional)
3. Define a dimension
4. Define a dataset
5. Define an event
6. Define a transformer
7. Map the transformer to the event

#### KPI

```json
{
  "name": "Attendance Bar Graph by School",
  "description": "This is a bar graph of attendance by school",
  "filter_dimensions": ["Schools", "Last 7 Days"]
}
```

#### Dimension

```json
{
  "id": "Dimension1",
  "name": "Schools",
  "type": "dynamic",
  "storage": {
    "indexes": ["name", "type"],
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
  "grade": 1
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
    "school_id": 901 //Dimension
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
        "name": "Last 7 Days"
      }
    }
  ]
}
```

### Instruments

- Instruments can be of the following types
  - currently available instruments - `counter` ([def](https://opentelemetry.io/docs/reference/specification/metrics/api/#counter)) - allows for aggregations as `sum`, `count`, `percentage`, `min`, `max`, `avg`, `percentile`
  - pending implementations - `meter`, `gauge`, `histogram`,

#### Event Grammar

Event grammar defines how an event will be structured (when being sent to ingestion) and how it will be mapped to a processor. It includes the following:

- Schema of the event
- Mapping of the event to a transformer
- Mappings
  - Mapping to event to a dataset
  - Mapping to a dimension
- Defines the type of instrument field that contains the instrument

An example of an event grammar is as follows:

```json
{
  "instrument_details": {
    "type": "COUNTER",
    "key": "count"
  },
  "name": "attendance_by_school_grade_for_a_day",
  "is_active": true,
  "event_schema": {
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$id": "http://example.com/example.json",
    "type": "object",
    "default": {},
    "title": "Root Schema",
    "required": ["date", "grade", "school_id"],
    "properties": {
      "date": {
        "type": "string",
        "default": "",
        "title": "The date Schema",
        "examples": ["2019-01-01"]
      },
      "grade": {
        "type": "integer",
        "default": 0,
        "title": "The grade Schema",
        "examples": [1]
      },
      "school_id": {
        "type": "integer",
        "default": 0,
        "title": "The school_id Schema",
        "examples": [901]
      }
    },
    "examples": [
      {
        "date": "2019-01-01",
        "grade": 1,
        "school_id": 901
      }
    ]
  }
}
```

A sample event for the above schema would be

```json
{
  "date": "2019-01-01",
  "grade": 1,
  "school_id": 901
}
```

#### Transformer Grammar

tranformer is defined as the following: _t(event) => dataset_

Includes the following

- Event Schema it can act on
- Dataset Schema it outputs to
- Formula that allows

A transformer is a [actor](https://en.wikipedia.org/wiki/Actor_model). A sample actor can be something like this in Javascript. Ideally this could be the same for any another actor models in another framework as well. Currently we are using [xstate](https://xstate.js.org/docs/) for this.

```js
    const transformer = {
        name: "transformer_name",
        event_schema: "es11",
        dataset_schema: "ds23",
        config: {
            spawn((callback, receive) => {
                // send to parent
                callback('SOME_EVENT');

                // receive from parent
                receive((event) => {
                // handle event
                });

                // disposal
                return () => {
                /* do cleanup here */
                };
            }),
        }
    }
```

#### Pipe Definition

A pipe connects a transformer to an event and to a dataset.

```json
{
  "event": "event1",
  "transformer": "transformer1"
}
```
