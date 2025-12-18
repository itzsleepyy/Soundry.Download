import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DownloadRequest {
  url: string;
  format?: string;
  quality?: string;
}

export interface DownloadResponse {
  success: boolean;
  message?: string;
  files?: Array<{
    filename: string;
    size: number;
    path: string;
  }>;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  downloadFromSpotify(request: DownloadRequest): Observable<DownloadResponse> {
    return this.http.post<DownloadResponse>(`${this.apiUrl}/download/spotify`, request);
  }

  downloadFromYouTube(request: DownloadRequest): Observable<DownloadResponse> {
    return this.http.post<DownloadResponse>(`${this.apiUrl}/download/youtube`, request);
  }

  search(query: string, source: string = 'spotify'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search`, { query, source });
  }

  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`);
  }
}
