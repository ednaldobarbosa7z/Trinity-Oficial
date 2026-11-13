import { test as base, expect, Page, Route } from '@playwright/test';
import type { Cycle, Dashboard, Film, Profile, Review, User } from '../src/app/models/api.models';

export const API = 'http://localhost:3000';
export function fakeToken(id = 1, exp = Math.floor(Date.now() / 1000) + 7200): string {
  return (
    'test.' +
    Buffer.from(JSON.stringify({ user_id: id, exp })).toString('base64url') +
    '.test-signature'
  );
}
export class Scenario {
  user: User = {
    id: 1,
    nome: 'Ana Silva',
    nickname: 'ana.cinema',
    email: 'ana@example.com',
    url_foto_perfil: null,
    has_club: true,
  };
  others: User[] = [
    { id: 2, nome: 'Bruna Costa', nickname: 'bruna.filmes', url_foto_perfil: null },
    { id: 3, nome: 'Caio Lima', nickname: 'caio.lima', url_foto_perfil: null },
  ];
  hasClub = true;
  admin = true;
  configured = true;
  loginStatus = 200;
  dashboardFailures = 0;
  reviewFailure = false;
  expireProfile = false;
  calls: { method: string; path: string; body: unknown }[] = [];
  searches: string[] = [];
  tmdbAuthHeaders: (string | null)[] = [];
  film: Film = {
    id: 10,
    titulo: 'A Chegada',
    sinopse:
      'Uma linguista é chamada para entender uma nova forma de se comunicar. Uma história sobre tempo, escolhas e o que nos conecta.',
    ano_lancamento: '2016',
    url_poster: '/test-poster/chegada',
    url_backdrop: null,
    tmdb_id: '329865',
  };
  cycles: Cycle[] = Array.from({ length: 13 }, (_, index) => {
    const date = new Date(2026, 10 - index, 1);
    return {
      id: 42 - index,
      mes: date.getMonth() + 1,
      ano: date.getFullYear(),
      tema: index === 0 ? 'Outros mundos, novas perspectivas' : 'Histórias para conversar',
      status: index === 0 ? 'ABERTO' : 'FECHADO',
      qtd_slots: 2,
    };
  });
  current: Dashboard['ciclo_atual'] = {
    ...this.cycles[0],
    slots: [
      { id: 31, posicao: 1, user: this.others[0], filme: this.film, minha_avaliacao: null },
      { id: 32, posicao: 2, user: this.user, filme: null, minha_avaliacao: null },
    ],
    reunioes: [
      {
        id: 9,
        titulo: 'Conversa depois dos créditos',
        data_hora: '2026-11-25T22:00:00Z',
        tipo: 'Online',
        link_ou_local: 'https://example.com/encontro',
      },
    ],
  };
  reviews: Review[] = [
    {
      id: 90,
      nota: 4.5,
      comentario:
        'Uma história sobre ouvir o outro. A fotografia e a trilha sonora ficam com a gente depois da sessão.',
      destaque: 'Fotografia e trilha sonora',
      assistiria_novamente: true,
      created_at: '2026-11-10T19:00:00Z',
      user: this.others[0],
      curtidas_count: 2,
      curtido_por_mim: false,
    },
  ];
  dashboard(): Dashboard {
    return {
      clube: {
        id: 1,
        nome: 'Clube Entre Cenas',
        descricao: 'Uma boa conversa começa com um filme.',
        codigo_acesso: 'CINE26',
        foto_clube: null,
        discord_configurado: this.configured,
      },
      membros: [this.user, ...this.others],
      sou_admin: this.admin,
      meu_id: this.user.id,
      ciclo_atual: this.current,
      atividades: [
        {
          tipo: 'indicacao',
          user_id: 2,
          user: 'bruna.filmes',
          avatar: null,
          filme: 'A Chegada',
          data: '2026-11-10T19:00:00Z',
        },
        {
          tipo: 'avaliacao',
          user_id: 3,
          user: 'caio.lima',
          avatar: null,
          filme: 'Interestelar',
          data: '2026-11-11T20:00:00Z',
          nota: 4.5,
        },
      ],
    };
  }
  profile(page: number, id = this.user.id): Profile {
    const user = id === this.user.id ? this.user : this.others.find((user) => user.id === id)!;
    return {
      user,
      clube: { nome: this.dashboard().clube.nome, codigo: 'CINE26' },
      amigos: [this.user, ...this.others],
      conquistas: { primeiro_play: true, cinefilo_veterano: true, curador_polemico: false },
      stats: { total_avaliacoes: 12, total_filmes_assistidos: 12 },
      pagination: { page, per_page: 10, total_avaliacoes: 12, total_recados: 11 },
      recados_recebidos: [
        {
          id: page,
          autor: 'bruna.filmes',
          filme_titulo: 'A Chegada',
          nota: 4.5,
          texto:
            page === 1
              ? 'Uma ótima indicação para o tema deste mês!'
              : 'Mais uma conversa sobre cinema.',
        },
      ],
      avaliacoes: [
        {
          id: page,
          nota: 4.5,
          comentario:
            page === 1
              ? 'Uma sessão para lembrar e compartilhar.'
              : 'A segunda página também conta uma história.',
          destaque: 'Uma ótima conversa',
          assistiria_novamente: true,
          created_at: '2026-11-10T19:00:00Z',
          filme: {
            titulo: page === 1 ? 'A Chegada' : 'Interestelar',
            poster: '/test-poster/chegada',
            ano: '2016',
          },
        },
      ],
    };
  }
}

async function json(route: Route, body: unknown, status = 200, total?: number) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Expose-Headers': 'X-Total-Count, X-Page, X-Per-Page',
      ...(total === undefined ? {} : { 'X-Total-Count': String(total) }),
    },
    body: status === 204 ? '' : JSON.stringify(body),
  });
}
export async function authorize(page: Page, scenario: Scenario) {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('usuario_dados', JSON.stringify(user));
    },
    { token: fakeToken(scenario.user.id), user: scenario.user },
  );
}
export const test = base.extend<{ scenario: Scenario }>({
  scenario: async ({ page }, use) => {
    const state = new Scenario();
    await page.route('**/test-poster/**', async (route) => {
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#6d8179"/><stop offset="1" stop-color="#162124"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/><ellipse cx="200" cy="240" rx="130" ry="45" fill="#202d2e"/><path d="M0 490 Q200 340 400 490V600H0" fill="#0d1719"/><text x="200" y="525" text-anchor="middle" fill="#f1e7cd" font-size="34" font-family="Arial" letter-spacing="7">A CHEGADA</text></svg>',
      });
    });
    await page.route('https://api.themoviedb.org/3/search/movie**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('query') || '';
      const pageNumber = Number(url.searchParams.get('page') || 1);
      state.searches.push(query);
      state.tmdbAuthHeaders.push(route.request().headers()['authorization'] || null);
      await json(route, {
        page: pageNumber,
        total_pages: 2,
        total_results: 21,
        results: [
          {
            id: 603,
            title: pageNumber === 1 ? 'Matrix' : 'Matrix Reloaded',
            overview: 'Uma descoberta muda a forma de ver o mundo.',
            release_date: '1999-03-31',
            poster_path: null,
            backdrop_path: null,
          },
        ],
      });
    });
    await page.route(API + '/**', async (route) => {
      const request = route.request(),
        method = request.method(),
        url = new URL(request.url()),
        path = url.pathname;
      if (method === 'OPTIONS') return json(route, {}, 204);
      const body = request.postDataJSON();
      state.calls.push({ method, path, body });
      const pageNumber = Number(url.searchParams.get('page') || 1);
      if (path === '/auth/login') {
        if (state.loginStatus !== 200)
          return json(route, { error: 'Email ou senha inválidos' }, state.loginStatus);
        return json(route, { token: fakeToken(), user: state.user });
      }
      if (path === '/users' && method === 'POST') {
        Object.assign(state.user, {
          nome: body.user.nome,
          nickname: body.user.nickname,
          email: body.user.email,
          id: 1,
          has_club: false,
        });
        state.hasClub = false;
        state.current = null;
        state.cycles = [];
        return json(route, { token: fakeToken(), user: state.user }, 201);
      }
      if (path === '/clubes/meu_clube') {
        if (state.dashboardFailures > 0) {
          state.dashboardFailures--;
          return json(route, { error: 'Indisponível' }, 500);
        }
        return state.hasClub
          ? json(route, state.dashboard())
          : json(route, { error: 'Sem clube' }, 404);
      }
      if ((path === '/clubes' && method === 'POST') || path === '/clubes/entrar') {
        state.hasClub = true;
        state.user.has_club = true;
        return json(route, { clube: state.dashboard().clube });
      }
      if (path === '/clubes/1/ciclos' && method === 'GET')
        return json(
          route,
          state.cycles.slice((pageNumber - 1) * 12, pageNumber * 12),
          200,
          state.cycles.length,
        );
      if (path === '/clubes/1/ciclos/mensal') {
        const input = body.ciclo;
        if (state.cycles.some((cycle) => cycle.mes === input.mes && cycle.ano === input.ano))
          return json(route, { error: 'Já existe um ciclo para este mês.' }, 422);
        const cycle = { ...input, id: 100, status: 'ABERTO' as const };
        state.cycles.unshift(cycle);
        return json(route, cycle, 201);
      }
      if (path.startsWith('/clubes/1/ciclo_detalhes/')) {
        const [month, year] = path.split('/').slice(-2).map(Number);
        const cycle = state.cycles.find((cycle) => cycle.mes === month && cycle.ano === year);
        return json(
          route,
          cycle
            ? {
                ...cycle,
                slots:
                  state.current?.slots.map((slot) => ({
                    ...slot,
                    filme: slot.filme
                      ? {
                          id: slot.filme.id,
                          titulo: slot.filme.titulo,
                          poster: slot.filme.url_poster,
                        }
                      : null,
                  })) || [],
              }
            : { existe: false },
        );
      }
      if (path === '/clubes/1/update_ciclo_admin') {
        const cycle = state.cycles.find((cycle) => cycle.id === body.ciclo_id)!;
        Object.assign(cycle, { tema: body.tema, status: body.status });
        return json(route, { message: 'Atualizado' });
      }
      if (path === '/clubes/1/update_slot_admin')
        return json(route, { error: 'O filme já possui avaliações e não pode ser removido.' }, 422);
      if (method === 'DELETE' && path.startsWith('/clubes/1/ciclos/')) {
        state.cycles = state.cycles.filter((cycle) => cycle.id !== Number(path.split('/').pop()));
        return json(route, { message: 'Excluído' });
      }
      if (path.startsWith('/clubes/1/salvar_filme/')) {
        const id = Number(path.split('/').pop()),
          slot = state.current?.slots.find((slot) => slot.id === id);
        if (!slot || slot.user?.id !== state.user.id)
          return json(route, { error: 'Vaga inválida' }, 422);
        await new Promise((resolve) => setTimeout(resolve, 180));
        slot.filme = { id: 11, ...body };
        return json(route, slot);
      }
      if (path === '/avaliacoes' && method === 'POST') {
        if (state.reviewFailure)
          return json(route, { errors: ['Você já avaliou este filme.'] }, 422);
        const slot = state.current?.slots.find(
          (slot) => slot.filme?.id === body.avaliacao.filme_id,
        );
        if (slot) slot.minha_avaliacao = { id: 91, nota: body.avaliacao.nota };
        return json(route, { id: 91, ...body.avaliacao }, 201);
      }
      if (path.startsWith('/avaliacoes/filme/')) return json(route, state.reviews, 200, 21);
      if (path.endsWith('/toggle_like')) {
        const review = state.reviews[0];
        review.curtido_por_mim = !review.curtido_por_mim;
        review.curtidas_count += review.curtido_por_mim ? 1 : -1;
        return json(route, { curtido: review.curtido_por_mim, count: review.curtidas_count });
      }
      if (path === '/clubes/catalogo') {
        if (!state.cycles.length) return json(route, [], 200, 0);
        const movie = {
          id: 10,
          titulo: pageNumber === 1 ? 'A Chegada' : 'Interestelar',
          ano: '2016',
          poster: '/test-poster/chegada',
          backdrop: null,
          sinopse: state.film.sinopse,
          indicado_por: { id: 2, nickname: 'bruna.filmes' },
          stats: {
            media_geral: 4.5,
            total_avaliacoes: 21,
            porcentagem_rewatch: 90,
            is_polemico: false,
          },
        };
        return json(
          route,
          [
            {
              mes: pageNumber === 1 ? 11 : 4,
              ano: 2026,
              tema: 'Outros mundos, novas perspectivas',
              filmes: [
                movie,
                {
                  ...movie,
                  id: 11,
                  titulo: 'O Fabuloso Destino de Amélie Poulain',
                  poster: '/missing-poster.jpg',
                },
              ],
            },
          ],
          200,
          7,
        );
      }
      if (path === '/users/perfil' && method === 'PUT') {
        Object.assign(state.user, body.user);
        return json(route, { user: state.user, message: 'Atualizado' });
      }
      if (path === '/users/perfil' || /^\/users\/\d+\/perfil_publico$/.test(path)) {
        if (state.expireProfile) return json(route, { error: 'Unauthorized' }, 401);
        return json(
          route,
          state.profile(pageNumber, path === '/users/perfil' ? 1 : Number(path.split('/')[2])),
        );
      }
      if (path === '/clubes/discord') {
        state.configured = !!body.discord_webhook_url;
        return json(route, {
          message: 'Configuração salva. A confirmação será enviada em segundo plano.',
        });
      }
      if (path === '/clube/1/statistics' || path === '/clubes/1/statistics')
        return json(route, {
          clube: 'Clube Entre Cenas',
          top_10: [
            { id: 10, titulo: 'A Chegada', poster: '/test-poster/chegada', media: 4.5 },
            { id: 11, titulo: 'Interestelar', poster: null, media: 4.3 },
          ],
          pior_filme: { id: 12, titulo: 'Uma sessão diferente', poster: null, media: 2.5 },
          mais_generosos: [
            { ...state.user, foto_perfil: null, media_dada: 4.6, total_avaliacoes: 12 },
          ],
        });
      if (path === '/ciclos/42/reunioes' && method === 'POST') {
        state.current?.reunioes.push({ id: 10, ...body.reuniao });
        return json(route, { message: 'Agendado' }, 201);
      }
      if (path.startsWith('/ciclos/42/reunioes/') && method === 'DELETE') {
        if (state.current)
          state.current.reunioes = state.current.reunioes.filter(
            (meeting) => meeting.id !== Number(path.split('/').pop()),
          );
        return json(route, { message: 'Removido' });
      }
      return json(route, { error: 'Unexpected mock endpoint: ' + method + ' ' + path }, 404);
    });
    await use(state);
  },
});
export { expect };
