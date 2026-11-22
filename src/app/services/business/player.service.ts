import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreatePlayerDTO,
  UpdatePlayerDTO,
} from '../../models/dtos/business/player-request.dto';
import { PlayerProfile } from '../../models/business/player-profile.model';
import { Player } from '../../models/business/player.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api/players`;

  constructor(private readonly http: HttpClient) {}

  public findAll(): Observable<Player[]> {
    return this.http.get<Player[]>(this.baseUrl);
  }

  public findById(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.baseUrl}/${id}`);
  }

  public findProfile(id: number): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${this.baseUrl}/${id}/profile`);
  }

  public create(player: CreatePlayerDTO): Observable<Player> {
    return this.http.post<Player>(this.baseUrl, player);
  }

  public update(id: number, player: UpdatePlayerDTO): Observable<Player> {
    return this.http.patch<Player>(`${this.baseUrl}/${id}`, player);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
