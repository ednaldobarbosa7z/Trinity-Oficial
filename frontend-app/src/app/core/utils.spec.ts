import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage, safeExternalUrl, safeRedirect, tokenPayload } from './utils';

describe('Limites de sessão e mensagens', () => {
  it('rejeita tokens malformados e exige os campos de sessão', () => {
    expect(tokenPayload('invalido')).toBeNull();
    expect(tokenPayload('a.' + btoa(JSON.stringify({ exp: 42 })) + '.b')).toBeNull();
    expect(tokenPayload('a.' + btoa(JSON.stringify({ exp: 42, user_id: 7 })) + '.b')).toEqual({
      exp: 42,
      user_id: 7,
    });
  });
  it('aceita apenas redirecionamentos internos conhecidos', () => {
    expect(safeRedirect('/historico?page=2')).toBe('/historico?page=2');
    for (const value of [
      'https://evil.test',
      '//evil.test',
      '/login',
      '/dashboard\\evil',
      '/desconhecido',
    ]) {
      expect(safeRedirect(value)).toBe('/dashboard');
    }
  });
  it('recusa protocolos executáveis nos links dos encontros', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl('data:text/html,teste')).toBeNull();
    expect(safeExternalUrl('https://example.com/reuniao')).toBe('https://example.com/reuniao');
  });
  it('mostra mensagens úteis sem vazar erros internos', () => {
    expect(
      errorMessage(new HttpErrorResponse({ status: 500, error: { error: 'SQL password secret' } })),
    ).not.toContain('secret');
    expect(errorMessage(new HttpErrorResponse({ status: 429 }))).toContain('Aguarde');
    expect(
      errorMessage(
        new HttpErrorResponse({
          status: 422,
          error: { errors: ['Nome obrigatório', 'Nota inválida'] },
        }),
      ),
    ).toBe('Nome obrigatório. Nota inválida');
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('conexão');
  });
});
