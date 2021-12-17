
export interface Items {
  type: string | array | object
}

export interface JSProperty {
  type: string
  title: string
  readonly?: boolean
  comment?: string
  required?: array
  uniqueItems?: boolean
  default?: number | string | null | undefined
  enum?: array
  items?: Items | JsonSchema
  additionalItems?: Items | JsonSchema | undefined
  properties?: OBJsonSchemaProperties
  minimum?: string | number | undefined
  maximum?: string | number | undefined
}

export interface OBJsonSchemaProperties {
  [key: string]: OBJSProperty
}

export interface JsonSchema {
  title?: string;
  type: string;
  required?: any;
  items?: object;
  properties?: OBJsonSchemaProperties; 
  [key: string]: string | any;
}

