import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateTournamentDTO,
  UpdateTournamentDTO,
} from '../models/dtos/tournament-request.dto';
import { Tournament, TournamentDevelopment } from '../models/tournament.model';

/**
 * Service responsible for accessing the tournament REST endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api/tournaments`;

  constructor(private readonly http: HttpClient) {}

  public findAll(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.baseUrl);
  }

  public findById(id: number): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.baseUrl}/${id}`);
  }

  public create(tournament: CreateTournamentDTO): Observable<Tournament> {
    return this.http.post<Tournament>(this.baseUrl, tournament);
  }

  public update(
    id: number,
    tournament: UpdateTournamentDTO
  ): Observable<Tournament> {
    return this.http.patch<Tournament>(`${this.baseUrl}/${id}`, tournament);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  public findDevelopment(id: number): Observable<TournamentDevelopment> {
    return this.http.get<TournamentDevelopment>(`${this.baseUrl}/${id}/development`);
  }
}
