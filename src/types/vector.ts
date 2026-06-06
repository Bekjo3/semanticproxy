export interface IVectorMetadata {
  chat_id: string;
  user_prompt: string;
  response: string;
  [key: string]: string | boolean | number | string[]; // to allow for any additional metadata. could be timestamp: 1712345678, is_cached: true, tags: ["backend", "cache"] etc ...
  // TODO: If query/filter logic depends on specific fields, will promote them to explicit typed properties.
}

export interface IVectorRecord {
  id: string;
  values: number[];
  metadata: IVectorMetadata;
}

// Input contract for querying the database
export interface IQueryVectorParams {
  vector: number[];
  namespace?: string;
}

// Output contract for the matched record and its confidence score
export interface IQueryResult {
  record: IVectorRecord;
  score: number;
}