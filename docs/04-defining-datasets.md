### Dataset

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
    "school_id": 901, //Dimension
    "indexes": [["date"], ["school_id"]] // Happen automatically
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
