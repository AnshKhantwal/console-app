import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PatientService } from '../../services/patient.service';
import { Patient, DocumentType } from '../../models/patient.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css']
})
export class PatientDetailComponent implements OnInit {
  menuOpen = false;
  documentTypeDropdownOpen = false;

  patient: Patient | undefined;
  documentTypes: DocumentType[] = [];
  selectedDocumentTypeId = '';
  remarks = '';
  preparedDate = '';
  selectedFile: File | null = null;
  fileName = '';
  isLoading = false;
  isSubmitting = false;

  // ---------- TOAST SYSTEM ----------
  toasts: any[] = [];
  toastId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.setDefaultDate();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPatient(id);
      this.loadDocumentTypes();
    }
  }

  // ---------- TOAST METHODS ----------
  showToast(message: string, type: 'error' | 'success' = 'error') {
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

    setTimeout(() => this.closeToast(id), 3500);
  }

  closeToast(id: number, animate: boolean = true) {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;

    if (animate) {
      toast.hide = true;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 250);
    } else {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }

  // ---------- DATE ----------
  setDefaultDate(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.preparedDate = `${year}-${month}-${day}`;
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ---------- LOAD DATA ----------
  loadPatient(id: string): void {
    this.isLoading = true;

    this.patientService.getPatientById(id).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load patient', error);
        this.showToast('Failed to load patient details');
        this.isLoading = false;
      }
    });
  }

  loadDocumentTypes(): void {
    this.patientService.getDocumentTypes().subscribe({
      next: (types) => {
        this.documentTypes = types;
      },
      error: (error) => {
        console.error('Failed to load document types', error);
        this.showToast('Failed to load document types');
      }
    });
  }

  get selectedDocumentTypeLabel(): string {
    if (!this.selectedDocumentTypeId) {
      return 'Select document type';
    }

    const selectedType = this.documentTypes.find(
      type => type.row_Id.toString() === this.selectedDocumentTypeId
    );

    return selectedType?.type || 'Select document type';
  }

  toggleDocumentTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();

    if (this.isSubmitting) {
      return;
    }

    this.documentTypeDropdownOpen = !this.documentTypeDropdownOpen;
  }

  closeDocumentTypeDropdown(): void {
    this.documentTypeDropdownOpen = false;
  }

  selectDocumentType(doc: DocumentType, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDocumentTypeId = doc.row_Id.toString();
    this.closeDocumentTypeDropdown();
  }

  // ---------- FILE ----------
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  // ---------- SUBMIT ----------
  onSubmit(): void {

    const missingFields: string[] = [];

    if (!this.selectedDocumentTypeId || this.selectedDocumentTypeId.trim() === '') {
      missingFields.push('document type');
    }

    if (!this.selectedFile) {
      missingFields.push('file');
    }

    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        this.showToast(`Please select ${missingFields[0]}`);
      } else {
        this.showToast(`Please select ${missingFields.join(' and ')}`);
      }
      return;
    }

    if (!this.patient) {
      this.showToast('Patient information not available');
      return;
    }

    const dateToSubmit = this.preparedDate || this.getTodayDate();
    this.isSubmitting = true;

    this.patientService.uploadDocument(
      this.patient.rowId.toString(),
      Number(this.selectedDocumentTypeId),
      this.remarks,
      this.selectedFile!,
      dateToSubmit
    ).subscribe({
      next: () => {
        this.showToast('Document uploaded successfully!', 'success');

        this.selectedDocumentTypeId = '';
        this.closeDocumentTypeDropdown();
        this.remarks = '';
        this.selectedFile = null;
        this.fileName = '';
        this.setDefaultDate();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Upload failed', error);

        let errorMsg = 'Failed to upload document. ';
        if (error.error?.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += 'Please try again.';
        }

        this.showToast(errorMsg);
        this.isSubmitting = false;
      }
    });
  }

  // ---------- NAV ----------
  onBack(): void {
    this.router.navigate(['/welcome']);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (this.menuOpen && !target?.closest('.nav-content')) {
      this.closeMenu();
    }

    if (this.documentTypeDropdownOpen && !target?.closest('.document-type-dropdown')) {
      this.closeDocumentTypeDropdown();
    }
  }

  goHome(): void {
    this.closeMenu();
    this.router.navigate(['/welcome']);
  }

  onLogout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
