export type FieldType = {
  label: string;
  type: string;
  required: boolean;
  // `group`, `event_location`, `placeholder`, and `helpText` are populated
  // from the backend payload but the system-default fields (`name`, `email`)
  // are constructed client-side without them — keep optional so default
  // literals don't need to repeat empty strings.
  group?: string;
  event_location?: string;
  placeholder?: string;
  helpText?: string;
  order: number;
  enabled?: boolean;
  settings?: {
    options?: string[];
    min?: number;
    max?: number;
    format?: string;
    maxFileSize?: number;
    maxFileCount?: number;
    allowedFiles?: string[];
    termsText?: string;
  };
};

export type Fields = {
  system: FieldsGroup;
  location: FieldsGroup;
  custom: FieldsGroup;
  other?: FieldsGroup;
};

export type FieldsGroup = {
  [key: string]: FieldType;
}; 