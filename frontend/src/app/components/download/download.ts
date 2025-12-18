import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DownloadService, DownloadResponse } from '../../services/download';

interface SourceOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    SelectButtonModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './download.html',
  styleUrl: './download.scss',
})
export class DownloadComponent {
  url: string = '';
  selectedSource: string = 'spotify';
  loading: boolean = false;
  downloadResult: DownloadResponse | null = null;

  sourceOptions: SourceOption[] = [
    { label: 'Spotify', value: 'spotify' },
    { label: 'YouTube/SoundCloud', value: 'youtube' }
  ];

  constructor(
    private downloadService: DownloadService,
    private messageService: MessageService
  ) {}

  onDownload() {
    if (!this.url.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a URL'
      });
      return;
    }

    this.loading = true;
    this.downloadResult = null;

    const request = {
      url: this.url,
      format: 'mp3',
      quality: 'best'
    };

    const downloadObservable = this.selectedSource === 'spotify'
      ? this.downloadService.downloadFromSpotify(request)
      : this.downloadService.downloadFromYouTube(request);

    downloadObservable.subscribe({
      next: (response) => {
        this.loading = false;
        this.downloadResult = response;
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Download completed successfully'
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to download'
        });
      }
    });
  }

  clearUrl() {
    this.url = '';
    this.downloadResult = null;
  }
}
