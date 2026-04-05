import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Server
  },
  {
    path: 'landing',
    renderMode: RenderMode.Server
  },
  {
    path: 'welcome',
    renderMode: RenderMode.Server
  },
  {
    path: 'lead-prospect',
    renderMode: RenderMode.Server
  },
  {
    path: 'referrals',
    renderMode: RenderMode.Server
  },
  {
    path: 'patient-detail/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
