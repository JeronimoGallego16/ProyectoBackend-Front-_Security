import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { CreateRegistrationDTO } from '../../models/dtos/business/registration-request.dto';
import { Registration } from '../../models/business/registration.model';

/**
 * Service for individual tournament-team registration operations.
 */
@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api/registrations`;

  constructor(private readonly http: HttpClient) {}

  public findByTournament(tournamentId: number): Observable<Registration[]> {
    const params = new HttpParams().set('tournamentId', tournamentId);
    return this.http.get<Registration[]>(this.baseUrl, { params });
  }

  public findByTeam(teamId: number): Observable<Registration[]> {
    const params = new HttpParams().set('teamId', teamId);
    return this.http.get<Registration[]>(this.baseUrl, { params });
  }

  public create(registration: CreateRegistrationDTO): Observable<Registration> {
    return this.http.post<Registration>(this.baseUrl, registration);
  }

  public delete(registrationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${registrationId}`);
  }
}
