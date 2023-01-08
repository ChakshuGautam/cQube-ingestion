import { JSONSchema7 } from 'json-schema';

export interface Store {
  indexes: string[];
  primaryId: string;
  retention: number | null;
  bucket_size: number | null;
}

export interface Dimension {
  name: string;
  type: string;
  storage: Store;
  data: object | null;
  schema: JSONSchema7 | null;
}

// Example of a dimension:
// {
//   "name": "Schools",
//   "type": "dynamic",
//   "storage": {
//       "indexes": [
//           "name",
//           "type"
//       ],
//       "primaryId": "school_id",
//       "retention": null,
//       "bucket_size": null
//   },
//   "data": {
//       "school_id": 901,
//       "name": "A green door",
//       "type": "GSSS",
//       "enrollement_count": 345,
//       "district": "District",
//       "block": "Block",
//       "cluster": "Cluster",
//       "village": "Village"
//   }
// }