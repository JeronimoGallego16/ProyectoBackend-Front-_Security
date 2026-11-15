import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateMatchDTO,
  UpdateMatchDTO,
} from '../models/dtos/match-request.dto';
import { Match } from '../models/match.model';

/**
 * Service responsible for accessing the backend match REST endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/matches`;

  /**
   * Creates the match data-access service.
   *
   * @param http - Angular HTTP client used to call the backend.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves all matches.
   *
   * @returns Observable emitting the list of matches.
   */
  public findAll(): Observable<Match[]> {
    return this.http.get<Match[]>(this.baseUrl);
  }

  /**
   * Retrieves a match by its identifier.
   *
   * @param id - Identifier of the match to retrieve.
   * @returns Observable emitting the requested match.
   */
  public findById(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a match.
   *
   * @param match - Request data for the match.
   * @returns Observable emitting the created match.
   */
  public create(match: CreateMatchDTO): Observable<Match> {
    return this.http.post<Match>(this.baseUrl, match);
  }

  /**
   * Updates only the supplied fields of an existing match.
   *
   * @param id - Identifier of the match to update.
   * @param match - Request data containing only changed fields.
   * @returns Observable emitting the updated match.
   */
  public update(id: number, match: UpdateMatchDTO): Observable<Match> {
    return this.http.patch<Match>(`${this.baseUrl}/${id}`, match);
  }

  /**
   * Deletes a match.
   *
   * @param id - Identifier of the match to delete.
   * @returns Observable that completes when the match is deleted.
   */
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
