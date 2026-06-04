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
