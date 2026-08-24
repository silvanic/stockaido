import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface FeedbackPayload {
  message: string;
  email?: string;
}

/**
 * Envoie les retours/suggestions des utilisateurs vers la fonction Netlify `feedback`,
 * qui les stocke dans Netlify Database (Postgres).
 */
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly endpoint = '/api/feedback';

  constructor(private http: HttpClient) {}

  async send(payload: FeedbackPayload): Promise<void> {
    await firstValueFrom(this.http.post(this.endpoint, payload));
  }
}
