## Defining Dimensions

cQube supports arbitrary dimension to be stored. There are only two categories of dimensions that are supported:
1. Time based dimensions
2. Dynamic dimensions

For the Attendance Example, the following dimensions are viable dimensions
1. School
2. District
3. Time


### School as a dimension
Below is the specifications on how they should be defined in cQube.
1. Define the grammer for how the dimension data needs to be stored. Given that School and Districts are are very similar, they could be combined as well.For the school dimension it a sample data looks like the following - 
```json
{
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
The actual schema also includes the metadata that is required by cQube to store this dimension in the database. 
- The `indexes` field is used to create indexes on the database. This creats a simple BTree index for the list of columns shared.
- The `primary_id` field is used to create a primary key on the database.

The corresponding JSON Schema would need to be entered to accept the dimension as a valid input
```json
{
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$id": "http://example.com/example.json",
    "type": "object",
    "default": {},
    "title": "Root Schema",
    "required": [
        "name",
        "storage",
        "data"
    ],
    "properties": {
        "name": {
            "type": "string",
            "default": "",
            "title": "The name Schema",
            "examples": [
                "Schools"
            ]
        },
        "storage": {
            "type": "object",
            "default": {},
            "title": "The storage Schema",
            "required": [
                "indexes",
                "primaryId"
            ],
            "properties": {
                "indexes": {
                    "type": "array",
                    "default": [],
                    "title": "The indexes Schema",
                    "items": {
                        "type": "string",
                        "title": "A Schema",
                        "examples": [
                            "name",
                            "type"
                        ]
                    },
                    "examples": [
                        ["name",
                            "type"
                        ]
                    ]
                },
                "primaryId": {
                    "type": "string",
                    "default": "",
                    "title": "The primaryId Schema",
                    "examples": [
                        "school_id"
                    ]
                }
            },
            "examples": [{
                "indexes": [
                    "name",
                    "type"
                ],
                "primaryId": "school_id"
            }]
        },
        "data": {
            "type": "object",
            "default": {},
            "title": "The data Schema",
            "required": [
                "school_id",
                "name",
                "type",
                "enrollement_count",
                "district",
                "block",
                "cluster",
                "village"
            ],
            "properties": {
                "school_id": {
                    "type": "integer",
                    "default": 0,
                    "title": "The school_id Schema",
                    "examples": [
                        901
                    ]
                },
                "name": {
                    "type": "string",
                    "default": "",
                    "title": "The name Schema",
                    "examples": [
                        "A green door"
                    ]
                },
                "type": {
                    "type": "string",
                    "default": "",
                    "title": "The type Schema",
                    "examples": [
                        "GSSS"
                    ]
                },
                "enrollement_count": {
                    "type": "integer",
                    "default": 0,
                    "title": "The enrollement_count Schema",
                    "examples": [
                        345
                    ]
                },
                "district": {
                    "type": "string",
                    "default": "",
                    "title": "The district Schema",
                    "examples": [
                        "District"
                    ]
                },
                "block": {
                    "type": "string",
                    "default": "",
                    "title": "The block Schema",
                    "examples": [
                        "Block"
                    ]
                },
                "cluster": {
                    "type": "string",
                    "default": "",
                    "title": "The cluster Schema",
                    "examples": [
                        "Cluster"
                    ]
                },
                "village": {
                    "type": "string",
                    "default": "",
                    "title": "The village Schema",
                    "examples": [
                        "Village"
                    ]
                }
            },
            "examples": [{
                "school_id": 901,
                "name": "A green door",
                "type": "GSSS",
                "enrollement_count": 345,
                "district": "District",
                "block": "Block",
                "cluster": "Cluster",
                "village": "Village"
            }]
        }
    },
    "examples": [{
        "name": "Schools",
        "storage": {
            "indexes": [
                "name",
                "type"
            ],
            "primaryId": "school_id"
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
    }]
}
```
2. Once the dimension is defined, it can be added to cQube by using the dimension schema (definition grammar) API.
3. The next step is to insert data in the dimensions which can be done through a POST request to the dimension API. In this case it would be inserting the schools in the school dimension table.

### Notes:
1. All the APIs to enter the data are documented [here](https://github.com/Sunbird-cQube/spec-ms/blob/main/spec.yaml).
2. An update to the schema is not supported yet. To update please create a new schema and tie it up to the Dataset Model. Please note that this is a slower process and would lead to a downtime of the cQube instance until the migration is completed. Currently it can only happen through private APIs exposed to a developer.
3. A relationnal database is used to store the data in a flat manner. All fields are flattened and used as column names when creating a dimension table.
4. The schema provided to insert data is used to validate the data before inserting it into the database. This is to ensure that the data is in the correct format and the data types are correct. AJV is used to validate the data.

