import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  AssignPlayerSkillDTO,
  UpdatePlayerSkillDTO,
} from '../../models/dtos/business/player-skill-request.dto';
import { PlayerSkill } from '../../models/business/player-skill.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerSkillService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  public findByPlayer(playerId: number): Observable<PlayerSkill[]> {
    return this.http.get<PlayerSkill[]>(
      `${this.baseUrl}/players/${playerId}/skills`
    );
  }

  public findBySkill(skillId: number): Observable<PlayerSkill[]> {
    return this.http.get<PlayerSkill[]>(
      `${this.baseUrl}/skills/${skillId}/players`
    );
  }

  public create(
    playerId: number,
    assignment: AssignPlayerSkillDTO
  ): Observable<PlayerSkill> {
    return this.http.post<PlayerSkill>(
      `${this.baseUrl}/players/${playerId}/skills`,
      assignment
    );
  }

  public update(
    playerId: number,
    skillId: number,
    assignment: UpdatePlayerSkillDTO
  ): Observable<PlayerSkill> {
    return this.http.patch<PlayerSkill>(
      `${this.baseUrl}/players/${playerId}/skills/${skillId}`,
      assignment
    );
  }

  public delete(playerId: number, skillId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/players/${playerId}/skills/${skillId}`
    );
  }
}
