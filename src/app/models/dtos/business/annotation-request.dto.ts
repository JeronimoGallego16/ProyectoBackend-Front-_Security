export interface CreateAnnotationDTO {
  playerId: number;
  minute: number;
  type: string;
}

export interface UpdateAnnotationDTO {
  minute?: number;
  type?: string;
}
