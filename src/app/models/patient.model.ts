export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  kmedId?: string;
  rowId: number; 
  address?: string;
}

export interface TestDocument {
  testType: string;
  remarks: string;
  file: File | null;
  preparedDate?: string; // Add this for the date field
}

export interface LoginRequest {
  UserId: string;
  Password: string;
}

export interface LoginResponse {
  userId: string;
  token: string;
}

export interface DocumentType {
  row_Id: number;
  type: string;
}

export interface PatientFilterRequest {
  name?: string;
  mobile?: string;
  kmedId?: string;
}

export interface DocumentUploadRequest {
  patientId: string;
  documentTypeId: string;
  remarks: string;
  file: File;
  preparedDate?: string; // Add this for the date field
}