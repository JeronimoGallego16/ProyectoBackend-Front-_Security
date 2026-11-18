import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  CreateSportDTO,
  UpdateSportDTO,
} from '../models/dtos/sport-request.dto';
import { Sport } from '../models/sport.model';

/**
 * Service responsible for accessing the backend sport REST endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class SportService {
  private readonly baseUrl: string = `${environment.bussinesApiUrl}/sports`;

  /**
   * Creates the sport data-access service.
   *
   * @param http - Angular HTTP client used to call the backend.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves all sports.
   *
   * @returns Observable emitting the list of sports.
   */
  public findAll(): Observable<Sport[]> {
    return this.http.get<Sport[]>(this.baseUrl);
  }

  /**
   * Retrieves a sport by its identifier.
   *
   * @param id - Identifier of the sport to retrieve.
   * @returns Observable emitting the requested sport.
   */
  public findById(id: number): Observable<Sport> {
    return this.http.get<Sport>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a sport.
   *
   * @param sport - Request data for the sport.
   * @returns Observable emitting the created sport.
   */
  public create(sport: CreateSportDTO): Observable<Sport> {
    return this.http.post<Sport>(this.baseUrl, sport);
  }

  /**
   * Updates only the supplied fields of an existing sport.
   *
   * @param id - Identifier of the sport to update.
   * @param sport - Request data containing the updated sport fields.
   * @returns Observable emitting the updated sport.
   */
  public update(id: number, sport: UpdateSportDTO): Observable<Sport> {
    return this.http.patch<Sport>(`${this.baseUrl}/${id}`, sport);
  }

  /**
   * Deletes a sport.
   *
   * @param id - Identifier of the sport to delete.
   * @returns Observable that completes when the sport is deleted.
   */
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
