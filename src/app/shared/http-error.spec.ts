import { HttpErrorResponse } from '@angular/common/http';
import * as HttpError from './http-error';

describe('http-error helpers', () => {
  it('classifie une erreur 5xx en server', () => {
    const error = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
    const appError = HttpError.toAppHttpError(error);

    expect(appError.kind).toBe('server');
    expect(appError.status).toBe(503);
    expect(HttpError.isAppHttpError(appError)).toBeTrue();
  });

  it('classifie une erreur 4xx en client', () => {
    const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });
    const appError = HttpError.toAppHttpError(error);

    expect(appError.kind).toBe('client');
    expect(appError.status).toBe(400);
  });

  it('classifie status 0 en offline si le navigateur est hors ligne', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    const appError = HttpError.toAppHttpError(error, false);

    expect(appError.kind).toBe('offline');
  });

  it('classifie status 0 + TimeoutError en timeout', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: { name: 'TimeoutError' }
    });
    const appError = HttpError.toAppHttpError(error);

    expect(appError.kind).toBe('timeout');
  });

  it('retourne la meme instance si deja normalisee', () => {
    const normalized = HttpError.toAppHttpError(new HttpErrorResponse({ status: 500 }));
    const result = HttpError.toAppHttpError(normalized);

    expect(result).toBe(normalized);
  });
});