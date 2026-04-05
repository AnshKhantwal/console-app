import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  menuOpen = false;

  searchQuery = '';
  allPatients: Patient[] = [];
  searchResults: Patient[] = [];

  /* 🔽 AUTOCOMPLETE */
  suggestions: Patient[] = [];
  showSuggestions = false;
  activeIndex = -1;

  private debounceTimer: any;

  isLoading = false;
  hasSearched = false;

  toastMessage = '';
  showToast = false;

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllPatients();
  }

  /* 🔔 TOAST */
  showToastMessage(message: string): void {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  /* 📥 LOAD PATIENTS */
  loadAllPatients(): void {
    this.isLoading = true;

    this.patientService.getAllPatients().subscribe({
      next: (patients) => {
        this.allPatients = patients;
        this.isLoading = false;
      },
      error: () => {
        this.showToastMessage('Failed to load patients');
        this.isLoading = false;
      }
    });
  }

  /* 🔍 INPUT CHANGE (DEBOUNCED) */
  onInputChange(): void {
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      const query = this.searchQuery.trim().toLowerCase();

      if (query.length < 2) {
        this.hideSuggestions();
        return;
      }

      this.suggestions = this.allPatients
        .filter(p =>
          p.name.toLowerCase().includes(query) ||
          (p.phone ?? '').toString().includes(query) ||
          (p.id ?? '').toLowerCase().includes(query) ||
          (p.kmedId ?? '').toLowerCase().includes(query)
        )
        .slice(0, 8);

      this.activeIndex = -1;
      this.showSuggestions = true;
    }, 200);
  }

  /* ⌨️ KEYBOARD NAVIGATION */
  handleKeydown(event: KeyboardEvent): void {
    if (!this.showSuggestions || this.suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        this.activeIndex = Math.min(
          this.activeIndex + 1,
          this.suggestions.length - 1
        );
        event.preventDefault();
        break;

      case 'ArrowUp':
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        event.preventDefault();
        break;

      case 'Enter':
        if (this.activeIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.activeIndex]);
          event.preventDefault();
        }
        break;

      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  /* ✅ SELECT SUGGESTION */
  selectSuggestion(patient: Patient): void {
    this.searchQuery = patient.name;
    this.hideSuggestions();
    this.onSearch();
  }

  /* ❌ HIDE AUTOCOMPLETE */
  hideSuggestions(): void {
    this.showSuggestions = false;
    this.activeIndex = -1;
  }

  /* 🎯 SEARCH */
  onSearch(): void {
    this.hasSearched = true;
    this.hideSuggestions();

    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.showToastMessage('Please enter a search term');
      return;
    }

    const query = this.searchQuery.toLowerCase();

    this.searchResults = this.allPatients.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.phone ?? '').toString().includes(query) ||
      (p.id ?? '').toLowerCase().includes(query) ||
      (p.kmedId ?? '').toLowerCase().includes(query)
    );

    if (this.searchResults.length === 0) {
      this.showToastMessage('No patients found');
    }
  }

  /* 👆 PATIENT CLICK */
  onPatientSelect(patient: Patient): void {
    this.router.navigate(['/patient-detail', patient.id]);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.nav-content')) {
      return;
    }

    this.closeMenu();
  }

  /* 🚪 LOGOUT */
  onLogout(): void {
    this.closeMenu();
    this.authService.logout();
  }

  /* ✨ TEXT HIGHLIGHT */
  highlight(text: string): string {
    if (!text || !this.searchQuery) return text;
    return text.replace(
      new RegExp(`(${this.searchQuery})`, 'gi'),
      `<mark>$1</mark>`
    );
  }
}
