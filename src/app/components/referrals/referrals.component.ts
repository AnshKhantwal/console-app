import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProspectRow, ReferralsService } from '../../services/referrals.service';

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.css']
})
export class ReferralsComponent implements OnInit, OnDestroy {
  menuOpen = false;
  searchText = '';
  filterFrom = '';
  filterTo = '';
  prospects: ProspectRow[] = [];

  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private referralsService: ReferralsService
  ) {}

  ngOnInit(): void {
    this.sub = this.referralsService.prospects$.subscribe((rows) => {
      this.prospects = rows;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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

  clearFilters(): void {
    this.filterFrom = '';
    this.filterTo = '';
    this.searchText = '';
  }

  trackByKmedId(_index: number, row: ProspectRow): string {
    return row.kmedId;
  }

  get filteredProspects(): ProspectRow[] {
    const q = this.searchText.trim().toLowerCase();

    return this.prospects.filter((row) => {
      const matchesSearch =
        !q ||
        row.patientName.toLowerCase().includes(q) ||
        row.mobile.includes(q) ||
        row.kmedId.toLowerCase().includes(q) ||
        row.disease.toLowerCase().includes(q);

      const rowDate = row.addedOn;
      const matchesFrom = !this.filterFrom || rowDate >= this.filterFrom;
      const matchesTo = !this.filterTo || rowDate <= this.filterTo;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }
}
