import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProspectRow {
  kmedId: string;
  patientName: string;
  mobile: string;
  alternateMobile: string;
  disease: string;
  referralSource: string;
  doctorMobile: string;
  clinic: string;
  center: string;
  patientStatus: string;
  onProgram: string;
  addedOn: string;
  followUp: string;
  notes: string;
  documentsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReferralsService {
  private readonly prospectsSubject = new BehaviorSubject<ProspectRow[]>([
    {
      kmedId: '2603270402',
      patientName: 'Laxmi',
      mobile: '8076009560',
      alternateMobile: '8171575998',
      disease: 'TB',
      referralSource: 'Internet',
      doctorMobile: '9027493557',
      clinic: 'TB Clinic',
      center: 'TB Clinic Tigri',
      patientStatus: 'On Program',
      onProgram: 'On Treatment',
      addedOn: '2026-03-27',
      followUp: 'No Follow-up',
      notes: '-',
      documentsCount: 0
    },
    {
      kmedId: '2603270401',
      patientName: 'Shifa Khan',
      mobile: '8085224107',
      alternateMobile: 'Not Available',
      disease: 'TB',
      referralSource: 'Internet',
      doctorMobile: '-',
      clinic: 'TB Clinic',
      center: 'TB Clinic Mayur Vihar',
      patientStatus: 'Prospect',
      onProgram: '-',
      addedOn: '2026-03-27',
      followUp: '2026-03-30 10:45 AM',
      notes: 'Requested callback',
      documentsCount: 1
    }
  ]);

  get prospects$(): Observable<ProspectRow[]> {
    return this.prospectsSubject.asObservable();
  }

  getSnapshot(): ProspectRow[] {
    return this.prospectsSubject.value;
  }

  addProspect(row: ProspectRow): void {
    this.prospectsSubject.next([row, ...this.prospectsSubject.value]);
  }
}
