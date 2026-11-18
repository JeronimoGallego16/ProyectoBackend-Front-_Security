import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateTeamSportDTO,
  UpdateTeamSportDTO,
} from '../models/dtos/team-sport-request.dto';
import { TeamSport } from '../models/team-sport.model';

/**
 * Service responsible for accessing the backend team-sport assignment endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class TeamSportService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/team-sports`;

  /**
   * Creates the team-sport data-access service.
   *
   * @param http - Angular HTTP client used to call the backend.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves all team-sport assignments.
   *
   * @returns Observable emitting all assignments.
   */
  public findAll(): Observable<TeamSport[]> {
    return this.http.get<TeamSport[]>(this.baseUrl);
  }

  /**
   * Retrieves an assignment by its identifier.
   *
   * @param id - Unique team-sport assignment identifier.
   * @returns Observable emitting the requested assignment.
   */
  public findById(id: number): Observable<TeamSport> {
    return this.http.get<TeamSport>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a team-sport assignment.
   *
   * @param assignment - Team and sport identifiers for the new assignment.
   * @returns Observable emitting the created assignment.
   */
  public create(assignment: CreateTeamSportDTO): Observable<TeamSport> {
    return this.http.post<TeamSport>(this.baseUrl, assignment);
  }

  /**
   * Updates the supplied identifiers of an existing assignment.
   *
   * @param id - Unique identifier of the assignment to update.
   * @param assignment - Fields to change on the assignment.
   * @returns Observable emitting the updated assignment.
   */
  public update(
    id: number,
    assignment: UpdateTeamSportDTO
  ): Observable<TeamSport> {
    return this.http.patch<TeamSport>(`${this.baseUrl}/${id}`, assignment);
  }

  /**
   * Deletes an assignment without deleting its team or sport.
   *
   * @param id - Unique identifier of the assignment to delete.
   * @returns Observable that completes when the assignment is deleted.
   */
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
