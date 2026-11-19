import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { PhaseMatch } from '../models/phase-match.model';

/**
 * Service responsible for reading matches used by phase development views.
 */
@Injectable({
  providedIn: 'root',
})
export class PhaseMatchService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/matches`;

  constructor(private readonly http: HttpClient) {}

  public findAll(): Observable<PhaseMatch[]> {
    return this.http.get<PhaseMatch[]>(this.baseUrl);
  }
}
