import { Routes } from '@angular/router';
import { DownloadComponent } from './components/download/download';

export const routes: Routes = [
  { path: '', redirectTo: '/download', pathMatch: 'full' },
  { path: 'download', component: DownloadComponent }
];
