import { HttpErrorResponse } from '@angular/common/http';

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Não foi possível concluir. Tente novamente.';
  if (error.status === 0)
    return 'Não foi possível conectar. Confira sua conexão e tente novamente.';
  if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (error.status === 429)
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
  if (error.status >= 500)
    return 'O serviço está indisponível no momento. Tente novamente em instantes.';
  const body: unknown = error.error;
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (Array.isArray(record['errors'])) {
      const messages = record['errors'].filter((item): item is string => typeof item === 'string');
      if (messages.length) return messages.join('. ');
    }
    if (typeof record['error'] === 'string') return record['error'];
  }
  return error.status === 403
    ? 'Você não tem permissão para esta ação.'
    : error.status === 404
      ? 'Este conteúdo não está disponível.'
      : 'Verifique os dados e tente novamente.';
}

export function safeRedirect(value: string | null): string {
  return value &&
    /^\/(dashboard|filmes|historico|perfil(?:\/[1-9]\d*)?|clube\/[1-9]\d*\/estatisticas|setup)(?:\?[^\\]*)?$/.test(
      value,
    )
    ? value
    : '/dashboard';
}

export function tokenPayload(token: string | null): { user_id: number; exp: number } | null {
  if (!token || token.split('.').length !== 3) return null;
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(
      atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')),
    );
    if (!payload || typeof payload !== 'object') return null;
    const { user_id, exp } = payload as Record<string, unknown>;
    return typeof user_id === 'number' &&
      Number.isInteger(user_id) &&
      user_id > 0 &&
      typeof exp === 'number' &&
      Number.isFinite(exp)
      ? { user_id, exp }
      : null;
  } catch {
    return null;
  }
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function localDateTimeToIso(value: string): string | null {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
