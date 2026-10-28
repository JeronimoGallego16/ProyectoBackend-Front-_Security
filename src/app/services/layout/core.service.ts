import { Injectable, signal } from '@angular/core';
import { AppSettings, defaults } from '../../config';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  private readonly optionsSignal = signal<AppSettings>(defaults);

  // Get the current options
  getOptions(): AppSettings {
    return this.optionsSignal();
  }

  setOptions(options: Partial<AppSettings>) {
    this.optionsSignal.update((current) => ({
      ...current,
      ...options,
    }));
  }

  setLanguage(lang: string) {
    this.setOptions({ language: lang });
  }

  getLanguage() {
    return this.getOptions().language;
  }
}