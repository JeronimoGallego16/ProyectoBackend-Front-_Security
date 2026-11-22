import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateAnnotationDTO,
  UpdateAnnotationDTO,
} from '../../models/dtos/business/annotation-request.dto';
import { Annotation } from '../../models/business/annotation.model';

@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  public findByMatch(matchId: number): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(
      `${this.baseUrl}/matches/${matchId}/annotations`
    );
  }

  public create(
    matchId: number,
    annotation: CreateAnnotationDTO
  ): Observable<Annotation> {
    return this.http.post<Annotation>(
      `${this.baseUrl}/matches/${matchId}/annotations`,
      annotation
    );
  }

  public update(
    annotationId: number,
    annotation: UpdateAnnotationDTO
  ): Observable<Annotation> {
    return this.http.patch<Annotation>(
      `${this.baseUrl}/annotations/${annotationId}`,
      annotation
    );
  }

  public void(annotationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/annotations/${annotationId}`);
  }
}
