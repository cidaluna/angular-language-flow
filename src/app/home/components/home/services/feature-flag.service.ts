import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly baseUrl = `${environment.apiBaseUrl}/apiFF`;

  constructor(private http: HttpClient) {}

}
