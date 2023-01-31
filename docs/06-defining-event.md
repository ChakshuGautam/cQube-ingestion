### Instruments

- Instruments can be of the following types
  - currently available instruments - `counter` ([def](https://opentelemetry.io/docs/reference/specification/metrics/api/#counter)) - allows for aggregations as `sum`, `count`, `percentage`, `min`, `max`, `avg`, `percentile`
  - pending implementations - `meter`, `gauge`, `histogram`,

#### Event Grammar

Event grammar defines how an event will be structured (when being sent to ingestion) and how it will be mapped to a processor. It includes the following:

- Schema of the event
- Mappings
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
