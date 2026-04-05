import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { Patient, DocumentType } from '../models/patient.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // Attach Bearer token to every authenticated call
  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();        // <-- ensure AuthService stores token
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // ---------------- DOCUMENT TYPES ----------------
  getDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(
      `${this.apiUrl}/document/getdocumenttypes`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ---------------- GET ALL PATIENTS ----------------
  getAllPatients(): Observable<Patient[]> {
    return this.http
      .get<any>(`${this.apiUrl}/patient/getpatients`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map((response: any) => {
          // console.log('Raw patients API:', response);
          // console.log('Sample patient:', response[1]);

          const patients = Array.isArray(response)
            ? response
            : response?.data || [];

          return patients.map((p: any) => this.mapPatient(p));
        })
      );
  }

  // ---------------- MAP API → MODEL ----------------
  private mapPatient(apiPatient: any): Patient {

  return {
    id: apiPatient.kMedId ?? apiPatient.row_Id ?? '',

    name: `${apiPatient.firstName ?? ''} ${apiPatient.lastName ?? ''}`.trim(),

    phone:
      apiPatient.contactDetail?.mobile_No ??
      '',

    age: apiPatient.age ?? 0,

    gender: 
      apiPatient.gender === 'm' ? 'Male' :
      apiPatient.gender === 'f' ? 'Female' :
      'Unknown',

    kmedId: apiPatient.kMedId ?? '',

    rowId: apiPatient.row_Id, 

    address: apiPatient.contactDetail?.address ?? ''
  };
}

  // ---------------- GET PATIENT BY ID ----------------
  getPatientById(id: string): Observable<Patient> {
    return this.getAllPatients().pipe(
      map(patients => {
        const patient = patients.find(
          p => p.id === id || p.kmedId === id
        );
        if (!patient) throw new Error('Patient not found');
        return patient;
      })
    );
  }

  // ---------------- UPLOAD DOCUMENT ----------------
   // Change this method signature to include preparedDate parameter
uploadDocument(
  patientRowId: string,
  documentTypeId: number,
  remarks: string,
  file: File,
  preparedDate?: string // ✅ ADD THIS PARAMETER
): Observable<any> {
  const formData = new FormData();

  // Use provided date or default to today
  const dateToUse = preparedDate || new Date().toISOString().split('T')[0]; // ✅ ADD THIS

  formData.append('PatientID', patientRowId);
  formData.append('Documents[0].DocumentType', documentTypeId.toString());
  formData.append('Documents[0].PreparedOn', dateToUse); // ✅ USE dateToUse INSTEAD OF new Date()
  formData.append('Documents[0].Note', remarks || '');
  formData.append('Documents[0].File', file, file.name);

  return this.http.post(
    `${this.apiUrl}/document/upload`,
    formData,
    { headers: this.getAuthHeaders() }
  );
}
}
