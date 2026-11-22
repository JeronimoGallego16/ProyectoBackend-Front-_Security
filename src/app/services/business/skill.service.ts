import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateSkillDTO,
  UpdateSkillDTO,
} from '../../models/dtos/business/skill-request.dto';
import { Skill } from '../../models/business/skill.model';

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api/skills`;

  constructor(private readonly http: HttpClient) {}

  public findAll(): Observable<Skill[]> {
    return this.http.get<Skill[]>(this.baseUrl);
  }

  public findById(id: number): Observable<Skill> {
    return this.http.get<Skill>(`${this.baseUrl}/${id}`);
  }

  public create(skill: CreateSkillDTO): Observable<Skill> {
    return this.http.post<Skill>(this.baseUrl, skill);
  }

  public update(id: number, skill: UpdateSkillDTO): Observable<Skill> {
    return this.http.patch<Skill>(`${this.baseUrl}/${id}`, skill);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
