export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  itemId?: string; // For pointing to specific coordinate ID in list
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}
