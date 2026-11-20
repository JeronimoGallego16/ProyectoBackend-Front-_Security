import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateTeamDTO,
  UpdateTeamDTO,
} from '../../models/dtos/business/team-request.dto';
import { Team } from '../../models/business/team.model';

/**
 * Service responsible for accessing the backend team REST endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/teams`;

  /**
   * Creates the team data-access service.
   *
   * @param http - Angular HTTP client used to call the backend.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves all teams.
   *
   * @returns Observable emitting the list of teams.
   */
  public findAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  /**
   * Retrieves a team by its identifier.
   *
   * @param id - Identifier of the team to retrieve.
   * @returns Observable emitting the requested team.
   */
  public findById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a team.
   *
   * @param team - Request data for the team.
   * @returns Observable emitting the created team.
   */
  public create(team: CreateTeamDTO): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, team);
  }

  /**
   * Updates only the supplied fields of an existing team.
   *
   * @param id - Identifier of the team to update.
   * @param team - Request data containing only changed backend-supported fields.
   * @returns Observable emitting the updated team.
   */
  public update(id: number, team: UpdateTeamDTO): Observable<Team> {
    return this.http.patch<Team>(`${this.baseUrl}/${id}`, team);
  }

  /**
   * Deletes a team.
   *
   * @param id - Identifier of the team to delete.
   * @returns Observable that completes when the team is deleted.
   */
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
