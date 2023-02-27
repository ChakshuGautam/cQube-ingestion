# Events

## Types

The `Instrument` interface expects
- `type` : enum value of for defining the type of instrument to be used.
- `name` : used to provide a unique name to the instrument.

```ts
Instrument {
  type: InstrumentType;
  name: string;
}
```

The `EventGrammar` type expects
- `name` : a name to uniquely identify the grammar
- `instrument` : an instrument that needs to be applied
- `description` : a description about the data contained in the event
- `schema` : contains the event schema
- `instrument_field` : refers to the field or attribute over which the particular instrument is to be applied.
- `is_active` : indicates whether the grammar is actively being used 
- `dimension` : maps a dimension to the event. refer to the `datasets` documentation to understand the `DimensionMapping` type better.

```ts
EventGrammar {
  name: string;
  instrument: Instrument;
  description: string;
  schema: JSONSchema4;
  instrument_field: string;
  is_active: boolean;
  dimension: DimensionMapping;
}
```

## Instruments

Instruments can be of the following types
- currently available instruments - `counter` ([def](https://opentelemetry.io/docs/reference/specification/metrics/api/#counter)) - allows for aggregations such as `sum`, `count`, `percentage`, `min`, `max`, `avg`, `percentile`.

- pending implementations - `meter`, `gauge`, `histogram`.

## Event Grammar

Event grammar defines how an event will be structured (when being sent to ingestion) and how it will be mapped to a processor. It includes the following:

- Schema of the Event
- Mappings (Mapping to a dimension)
- Defines the type of instrument field that contains the instrument

An example of an Event Grammar is as follows:

```json
{
  "instrument": {
    "type": "COUNTER",
    "name": "count"
  },
  "description": "Aggregate attendance of a school for given day by grade",
  "name": "attendance_by_school_grade_for_a_day",
  "is_active": true,
  "schema": {
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
    "examples": [{
      "date": "2019-01-01",
      "grade": 1,
      "school_id": 901
    }]
  }
}
```

A Sample Event for the above schema can be defined as

```json
{
  "date": "2019-01-01",
  "grade": 1,
  "school_id": 901
}
```
