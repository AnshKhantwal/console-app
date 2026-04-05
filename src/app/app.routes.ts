import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { PatientDetailComponent } from './components/patient-detail/patient-detail.component';
import { LeadProspectComponent } from './components/lead-prospect/lead-prospect.component';
import { LandingComponent } from './components/landing/landing.component';
import { ReferralsComponent } from './components/referrals/referrals.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'patient-detail/:id', component: PatientDetailComponent },
  { path: 'lead-prospect', component: LeadProspectComponent },
  { path: 'referrals', component: ReferralsComponent },
  { path: '**', redirectTo: '/login' }
];