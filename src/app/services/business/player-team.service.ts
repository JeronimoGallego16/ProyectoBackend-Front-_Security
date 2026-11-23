import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  AssignPlayerTeamDTO,
  RetirePlayerTeamDTO,
} from '../../models/dtos/business/player-team-request.dto';
import { PlayerTeam } from '../../models/business/player-team.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerTeamService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  public findByPlayer(playerId: number): Observable<PlayerTeam[]> {
    return this.http.get<PlayerTeam[]>(
      `${this.baseUrl}/players/${playerId}/teams`
    );
  }

  public findByTeam(
    teamId: number,
    currentOnly = false
  ): Observable<PlayerTeam[]> {
    const params = new HttpParams().set('current', String(currentOnly));
    return this.http.get<PlayerTeam[]>(
      `${this.baseUrl}/teams/${teamId}/players`,
      { params }
    );
  }

  public assign(
    teamId: number,
    assignment: AssignPlayerTeamDTO
  ): Observable<PlayerTeam> {
    return this.http.post<PlayerTeam>(
      `${this.baseUrl}/teams/${teamId}/players`,
      assignment
    );
  }

  public retire(
    teamId: number,
    playerId: number,
    retirement: RetirePlayerTeamDTO
  ): Observable<PlayerTeam> {
    return this.http.patch<PlayerTeam>(
      `${this.baseUrl}/teams/${teamId}/players/${playerId}/retirement`,
      retirement
    );
  }

  public deleteScheduled(playerTeamId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/player-teams/${playerTeamId}`);
  }
}
