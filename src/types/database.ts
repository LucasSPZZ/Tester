export interface DatabaseTable {
  name: string;
  schema: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface DatabaseFunction {
  name: string;
  schema: string;
  returnType: string;
  parameters: FunctionParameter[];
  sourceCode: string;
  language: string;
}

export interface FunctionParameter {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: string;
}

export interface SupabaseConnection {
  url: string;
  serviceRoleKey: string;
  geminiApiKey?: string; // Opcional, será removido gradualmente
}

export interface DatabaseStructure {
  tables: DatabaseTable[];
  functions: DatabaseFunction[];
}