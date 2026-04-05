import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ProspectRow, ReferralsService } from '../../services/referrals.service';

interface ProspectForm {
  patientName: string;
  gender: string;
  age: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  address: string;
  area: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  practice: string;
  referralSource: string;
  diseaseCondition: string;
  patientStatus: string;
  addedOn: string;
  followUpDate: string;
  followUpTime: string;
  referralNote: string;
}

@Component({
  selector: 'app-lead-prospect',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lead-prospect.component.html',
  styleUrls: ['./lead-prospect.component.css']
})
export class LeadProspectComponent {
  menuOpen = false;
  isFormCollapsed = false;
  currentStep = 0;
  submittedPatientInfo = false;
  submittedAddress = false;
  submittedClinical = false;

  // ---------- TOAST SYSTEM ----------
  toasts: Array<{ id: number; message: string; type: 'error' | 'success'; hide: boolean }> = [];
  toastId = 0;

  formSteps: string[] = ['Patient Info', 'Address', 'Clinical Details'];

  // Validation helpers for each step
  isPatientInfoValid(): boolean {
    return !!(
      this.form.patientName.trim() &&
      this.form.gender &&
      this.isAgeValid() &&
      this.isMobileValid()
    );
  }

  isAgeValid(): boolean {
    // Accept only positive integer age between 1 and 150
    const age = Number(this.form.age);
    return Number.isInteger(age) && age > 0 && age <= 150;
  }

  isMobileValid(): boolean {
    // Accept only 10 digit numbers
    return /^\d{10}$/.test(this.form.mobileNumber.trim());
  }

  isAddressValid(): boolean {
    return !!(
      this.form.address.trim() &&
      this.form.area.trim()
    );
  }

  goToStep(step: number): void {
    if (step === 1) {
      this.submittedPatientInfo = true;
      if (!this.isPatientInfoValid()) {
        this.currentStep = 0;
        return;
      }
    }
    if (step === 2) {
      this.submittedAddress = true;
      if (!this.isPatientInfoValid()) {
        this.currentStep = 0;
        return;
      }
      if (!this.isAddressValid()) {
        this.currentStep = 1;
        return;
      }
    }
    this.currentStep = step;
  }

  showToast(message: string, type: 'error' | 'success' = 'error'): void {
    const id = ++this.toastId;

    const toast = {
      id,
      message,
      type,
      hide: false
    };

    this.toasts.unshift(toast);

    if (this.toasts.length > 5) {
      const last = this.toasts[this.toasts.length - 1];
      this.closeToast(last.id, false);
    }

    window.setTimeout(() => this.closeToast(id), 3500);
  }

  closeToast(id: number, animate: boolean = true): void {
    const toast = this.toasts.find((item) => item.id === id);
    if (!toast) return;

    if (animate) {
      toast.hide = true;
      window.setTimeout(() => {
        this.toasts = this.toasts.filter((item) => item.id !== id);
      }, 250);
      return;
    }

    this.toasts = this.toasts.filter((item) => item.id !== id);
  }

  practices: string[] = ['TB Clinic', 'General OPD', 'Chest Care'];
  referralSources: string[] = ['Internet', 'Word of Mouth', 'Doctor', 'Walk In'];
  diseases: string[] = ['TB', 'Diabetes', 'COPD'];
  patientStatuses: string[] = ['Prospect', 'On Program', 'Closed'];
  followUpTimes: string[] = ['09:00 AM', '10:30 AM', '12:00 PM', '03:00 PM', '05:30 PM'];

  form: ProspectForm = this.getDefaultForm();
  selectedFiles: File[] = [];

  isPinLookupLoading = false;
  pinLookupMessage = '';
  pinLookupError = false;
  private lastLookupPin = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private referralsService: ReferralsService
  ) {}

  /* ── Menu ── */

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.nav-content')) return;
    this.closeMenu();
  }

  onLogout(): void {
    this.closeMenu();
    this.authService.logout();
  }

  /* ── File handling ── */

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      this.selectedFiles = [];
      return;
    }
    this.selectedFiles = Array.from(input.files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.selectedFiles = Array.from(event.dataTransfer.files);
    }
  }

  /* ── PIN code lookup ── */

  onPinCodeInput(): void {
    const pin = this.form.zipCode.trim();

    if (pin.length < 6) {
      this.pinLookupMessage = '';
      this.pinLookupError = false;
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      this.pinLookupMessage = 'PIN code must be 6 digits.';
      this.pinLookupError = true;
      return;
    }

    if (pin === this.lastLookupPin) return;

    this.lookupAddressByPin(pin);
  }

  /* ── Save / Clear ── */

  onSaveReferral(): void {
    this.submittedPatientInfo = true;
    this.submittedAddress = true;
    this.submittedClinical = true;

    if (!this.isRequiredFormValid()) {
      // Navigate to the first step that has errors
      if (
        !this.isPatientInfoValid()
      ) {
        this.currentStep = 0;
      } else if (!this.isAddressValid()) {
        this.currentStep = 1;
      } else {
        this.currentStep = 2;
      }
      this.showToast('Please complete all required fields before saving.');
      return;
    }

    const newRow: ProspectRow = {
      kmedId: this.generateKmedId(),
      patientName: this.form.patientName,
      mobile: this.form.mobileNumber,
      alternateMobile: this.form.alternateMobileNumber || 'Not Available',
      disease: this.form.diseaseCondition,
      referralSource: this.form.referralSource,
      doctorMobile: '-',
      clinic: this.form.practice,
      center: this.form.practice,
      patientStatus: this.form.patientStatus,
      onProgram: this.form.patientStatus === 'On Program' ? 'On Treatment' : '-',
      addedOn: this.form.addedOn,
      followUp: this.form.followUpDate
        ? `${this.form.followUpDate}${this.form.followUpTime ? ` ${this.form.followUpTime}` : ''}`
        : 'No Follow-up',
      notes: this.form.referralNote || '-',
      documentsCount: this.selectedFiles.length
    };

    this.referralsService.addProspect(newRow);
    this.clearForm();
    this.showToast('Lead prospect saved successfully.', 'success');
  }

  clearForm(): void {
    this.form = this.getDefaultForm();
    this.selectedFiles = [];
    this.submittedPatientInfo = false;
    this.submittedAddress = false;
    this.submittedClinical = false;
    this.currentStep = 0;
    this.pinLookupMessage = '';
    this.pinLookupError = false;
    this.isPinLookupLoading = false;
    this.lastLookupPin = '';
  }

  /* ── Private helpers ── */

  private isRequiredFormValid(): boolean {
    return !!(
      this.form.patientName.trim() &&
      this.form.gender &&
      this.isAgeValid() &&
      this.isMobileValid() &&
      this.form.address.trim() &&
      this.form.area.trim() &&
      this.form.practice &&
      this.form.referralSource &&
      this.form.diseaseCondition &&
      this.form.patientStatus &&
      this.form.addedOn
    );
  }

  private generateKmedId(): string {
    return `${Date.now()}`.slice(-10);
  }

  private getDefaultForm(): ProspectForm {
    return {
      patientName: '',
      gender: '',
      age: '',
      mobileNumber: '',
      alternateMobileNumber: '',
      address: '',
      area: '',
      zipCode: '',
      city: '',
      state: '',
      country: '',
      practice: '',
      referralSource: '',
      diseaseCondition: '',
      patientStatus: '',
      addedOn: this.today(),
      followUpDate: '',
      followUpTime: '',
      referralNote: ''
    };
  }

  private today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private lookupAddressByPin(pin: string): void {
    this.isPinLookupLoading = true;
    this.pinLookupMessage = '';
    this.pinLookupError = false;

    this.http.get<any[]>(`/pincode-api/pincode/${pin}`).subscribe({
      next: (response) => {
        this.isPinLookupLoading = false;
        this.lastLookupPin = pin;

        const payload = Array.isArray(response) ? response[0] : null;
        const postOffices = payload?.PostOffice;

        if (payload?.Status === 'Success' && Array.isArray(postOffices) && postOffices.length > 0) {
          const office = postOffices[0];
          this.form.area = office.Name || '';
          this.form.city = office.District || '';
          this.form.state = office.State || '';
          this.form.country = office.Country || 'India';
          this.pinLookupMessage = 'Area, city, state, and country auto-filled from PIN code.';
          this.pinLookupError = false;
          return;
        }

        this.pinLookupMessage = 'No location found for this PIN code.';
        this.pinLookupError = true;
      },
      error: () => {
        this.isPinLookupLoading = false;
        this.pinLookupMessage = 'Unable to fetch PIN details right now.';
        this.pinLookupError = true;
      }
    });
  }
}