import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateFinalPhaseDTO,
  UpdateFinalPhaseDTO,
} from '../models/dtos/phase-request.dto';
import { Phase } from '../models/phase.model';

/**
 * Service responsible for accessing tournament phase endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class PhaseService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api/phases`;

  constructor(private readonly http: HttpClient) {}

  public findByTournament(tournamentId: number): Observable<Phase[]> {
    const params = new HttpParams().set('tournamentId', tournamentId);
    return this.http.get<Phase[]>(this.baseUrl, { params });
  }

  public create(phase: CreateFinalPhaseDTO): Observable<Phase> {
    return this.http.post<Phase>(this.baseUrl, phase);
  }

  public update(
    phaseId: number,
    phase: UpdateFinalPhaseDTO
  ): Observable<Phase> {
    return this.http.patch<Phase>(`${this.baseUrl}/${phaseId}`, phase);
  }

  public delete(phaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${phaseId}`);
  }
}
