import { HttpErrorResponse } from '@angular/common/http';

export type AppHttpErrorKind = 'offline' | 'timeout' | 'server' | 'client' | 'unknown';

export interface AppHttpError extends Error {
  kind: AppHttpErrorKind;
  status?: number;
  originalError: unknown;
  isAppHttpError: true;
}

export function getNavigatorOnlineState(): boolean | undefined {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') {
    return undefined;
  }
  return navigator.onLine;
}

export function isAppHttpError(error: unknown): error is AppHttpError {
  return !!error && typeof error === 'object' && (error as Partial<AppHttpError>).isAppHttpError === true;
}

export function toAppHttpError(error: unknown, onlineStateOverride?: boolean): AppHttpError {
  if (isAppHttpError(error)) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const kind = classifyHttpError(error, onlineStateOverride);
    const appError = new Error(error.message) as AppHttpError;
    appError.kind = kind;
    appError.status = error.status;
    appError.originalError = error;
    appError.isAppHttpError = true;
    return appError;
  }

  const appError = new Error('Unknown HTTP error') as AppHttpError;
  appError.kind = 'unknown';
  appError.originalError = error;
  appError.isAppHttpError = true;
  return appError;
}

function classifyHttpError(error: HttpErrorResponse, onlineStateOverride?: boolean): AppHttpErrorKind {
  const status = error.status;

  if (status === 0) {
    const reasonName = getErrorReasonName(error.error);
    if (reasonName === 'TimeoutError') {
      return 'timeout';
    }

    const onlineState = onlineStateOverride ?? getNavigatorOnlineState();
    if (onlineState === false) {
      return 'offline';
    }

    return 'timeout';
  }

  if (status >= 500) return 'server';
  if (status >= 400) return 'client';
  return 'unknown';
}

function getErrorReasonName(reason: unknown): string | undefined {
  if (!reason || typeof reason !== 'object') {
    return undefined;
  }
  if ('name' in reason && typeof (reason as { name?: unknown }).name === 'string') {
    return (reason as { name: string }).name;
  }
  return undefined;
}