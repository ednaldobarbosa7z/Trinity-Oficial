import AxeBuilder from '@axe-core/playwright';
import { test, expect, authorize } from './fixtures';

test('rotas privadas levam ao login e preservam o destino', async ({ page, scenario }) => {
  await page.goto('/filmes');
  await expect(page).toHaveURL(/\/login\?redirect/);
  await expect(page.getByRole('heading', { name: 'Seu lugar na sessão.' })).toBeVisible();
  expect(scenario.calls.filter((call) => call.path === '/clubes/meu_clube')).toHaveLength(0);
});

test('login apresenta erros de credenciais e limite, depois respeita o destino', async ({
  page,
  scenario,
}) => {
  await page.goto('/login?redirect=%2Fhistorico');
  await page.getByRole('button', { name: 'Entrar no clube' }).click();
  await expect(page.getByText('Preencha este campo.').first()).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('ana@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('senha-segura');
  scenario.loginStatus = 401;
  await page.getByRole('button', { name: 'Entrar no clube' }).click();
  await expect(page.getByRole('alert')).toContainText('Email ou senha inválidos');
  scenario.loginStatus = 429;
  await page.getByRole('button', { name: 'Entrar no clube' }).click();
  await expect(page.getByRole('alert')).toContainText('Aguarde');
  scenario.loginStatus = 200;
  await page.getByRole('button', { name: 'Entrar no clube' }).click();
  await expect(page).toHaveURL(/\/historico$/);
  await expect(page.getByRole('heading', { name: 'Os capítulos do clube.' })).toBeVisible();
});

test('cadastro valida confirmação e entra automaticamente para usar um convite', async ({
  page,
  scenario,
}) => {
  await page.goto('/register');
  await page.getByLabel('Seu nome', { exact: true }).fill('Ana Silva');
  await page.getByLabel('Nome no clube').fill('ana.cinema');
  await page.getByLabel('Email', { exact: true }).fill('ana@example.com');
  await page.getByLabel('Crie uma senha').fill('senha-segura');
  await page.getByLabel('Confirme sua senha').fill('diferente');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByText('As senhas precisam ser iguais.')).toBeVisible();
  expect(scenario.calls.filter((call) => call.path === '/users')).toHaveLength(0);
  await page.getByLabel('Confirme sua senha').fill('senha-segura');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel('Código do clube').fill('cine26');
  await page.getByRole('button', { name: 'Entrar no clube', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(scenario.calls.find((call) => call.path === '/clubes/entrar')?.body).toEqual({
    codigo_acesso: 'CINE26',
  });
});

test('é possível criar um clube sem receber estados de erro falsos', async ({ page, scenario }) => {
  scenario.hasClub = false;
  scenario.current = null;
  scenario.cycles = [];
  await authorize(page, scenario);
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Criar um clube', exact: true }).click();
  await page.getByLabel('Nome do clube').fill('Clube da sexta');
  await page.getByRole('button', { name: 'Criar meu clube', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole('heading', { name: 'A próxima seleção ainda está por vir.' }),
  ).toBeVisible();
});

test('indicação pesquisa sem vazar o token e salva somente a vaga selecionada', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Indicar meu filme' }).click();
  const dialog = page.getByRole('dialog', { name: 'Indicar um filme' });
  await dialog.getByLabel('Qual filme você quer indicar?').fill('Matrix');
  await dialog.getByRole('button', { name: 'Selecionar Matrix', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Matrix', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirmar indicação' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Matrix', exact: true })).toBeVisible();
  const saved = scenario.calls.filter((call) => call.path.startsWith('/clubes/1/salvar_filme/'));
  expect(saved).toHaveLength(1);
  expect(saved[0].path).toBe('/clubes/1/salvar_filme/32');
  expect(scenario.tmdbAuthHeaders.every((value) => value === null)).toBe(true);
});

test('avaliação valida campos e preserva o texto quando a API rejeita', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Avaliar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Sua crítica' });
  await dialog.getByRole('button', { name: 'Publicar avaliação' }).click();
  expect(scenario.calls.filter((call) => call.path === '/avaliacoes')).toHaveLength(0);
  await dialog.getByRole('radio', { name: '4,5 de 5 estrelas', exact: true }).check();
  await dialog
    .getByLabel('O que você achou do filme?')
    .fill('Um filme para continuar conversando depois dos créditos.');
  scenario.reviewFailure = true;
  await dialog.getByRole('button', { name: 'Publicar avaliação' }).click();
  await expect(dialog.getByRole('alert')).toContainText('já avaliou');
  await expect(dialog.getByLabel('O que você achou do filme?')).toHaveValue(
    'Um filme para continuar conversando depois dos créditos.',
  );
  scenario.reviewFailure = false;
  await dialog.getByRole('button', { name: 'Publicar avaliação' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Sua nota: 4,5')).toBeVisible();
});

test('modal mantém foco, fecha com Escape, restaura rolagem e pagina as críticas', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/dashboard');
  const opener = page.getByRole('button', { name: 'Ver detalhes', exact: true }).first();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'A Chegada', exact: true });
  await expect(
    dialog.getByText('Uma história sobre ouvir o outro.', { exact: false }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Curtir crítica de bruna.filmes' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Descurtir crítica de bruna.filmes' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Próxima página' }).click();
  await expect(dialog.getByRole('button', { name: 'Página anterior' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Fechar A Chegada', exact: true }).focus();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).not.toBe(
    'hidden',
  );
});

test('catálogo tem paginação e imagens quebradas recebem pôster substituto', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/filmes');
  const missing = page.getByRole('img', { name: 'Pôster de O Fabuloso Destino de Amélie Poulain' });
  await expect(missing).toHaveAttribute('src', '/poster-placeholder.svg');
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('heading', { name: 'Interestelar', exact: true })).toBeVisible();
  await page.getByLabel('Filtrar filmes nesta página').fill('nada-encontrado');
  await expect(
    page.getByRole('heading', { name: 'Nenhum filme com esse nome nesta página' }),
  ).toBeVisible();
});

test('perfil sincroniza nickname, tem paginação de avaliações e de recados', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  const dialog = page.getByRole('dialog', { name: 'Editar meu perfil' });
  await dialog.getByLabel('Nome no clube', { exact: true }).fill('ana.novas.cenas');
  await dialog.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.account-name')).toHaveText('ana.novas.cenas');
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page.getByText('A segunda página também conta uma história.')).toBeVisible();
  await page.getByRole('link', { name: 'Recados recebidos' }).click();
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page.getByText('Mais uma conversa sobre cinema.')).toBeVisible();
});

test('Discord usa o estado configurado, valida a URL e permite desconectar', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/perfil?aba=clube');
  const input = page.getByLabel('Substituir URL do webhook');
  await expect(input).toHaveValue('');
  await expect(page.getByText('Configurada', { exact: true })).toBeVisible();
  await input.fill('http://127.0.0.1/teste');
  await page.getByRole('button', { name: 'Salvar integração' }).click();
  expect(scenario.calls.filter((call) => call.path === '/clubes/discord')).toHaveLength(0);
  await input.fill('https://discord.com/api/webhooks/123/fake_test_token');
  await page.getByRole('button', { name: 'Salvar integração' }).click();
  await expect(
    page.getByText('Configuração salva. A confirmação será enviada em segundo plano.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Desconectar o Discord?' });
  await confirmation.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(page.getByText('Não configurada', { exact: true })).toBeVisible();
  expect(scenario.calls.filter((call) => call.path === '/clubes/discord').at(-1)?.body).toEqual({
    discord_webhook_url: null,
  });
});

test('gestão de ciclos pagina, abre novo mês e não executa exclusão cancelada', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/historico');
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole('button', { name: 'Novo ciclo', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Abrir um novo ciclo' });
  await create.getByLabel('Mês', { exact: true }).selectOption({ label: 'Fevereiro' });
  await create.getByLabel('Ano', { exact: true }).fill('2099');
  await create.getByLabel('Tema', { exact: false }).fill('Viagens no tempo');
  await create.getByLabel('Quantas indicações neste ciclo?').fill('4');
  await create.getByRole('button', { name: 'Abrir ciclo e sortear' }).click();
  await expect(create).not.toBeVisible();
  await page.getByRole('button', { name: 'Página anterior' }).click();
  await page.getByRole('button', { name: 'Ver ciclo de Fevereiro de 2099' }).click();
  const detail = page.getByRole('dialog', { name: 'Fevereiro de 2099', exact: true });
  await detail.getByRole('button', { name: 'Excluir ciclo' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Excluir o ciclo de Fevereiro?' });
  await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(detail).toBeVisible();
  expect(scenario.calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
});

test('admin recebe confirmação dentro do modal e membro não vê ações administrativas', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.goto('/historico');
  await page.getByRole('button', { name: 'Ver ciclo de Novembro de 2026' }).click();
  const detail = page.getByRole('dialog', { name: 'Novembro de 2026', exact: true });
  await detail.getByLabel('Tema', { exact: true }).fill('Um tema atualizado');
  await detail.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(detail.getByRole('status')).toContainText('Alterações do ciclo salvas.');
  await page.keyboard.press('Escape');
  scenario.admin = false;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Novo ciclo', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver ciclo de Novembro de 2026' }).click();
  await expect(detail.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Excluir ciclo' })).toHaveCount(0);
});

test('encontro usa horário local e exclusão pede confirmação', async ({ page, scenario }) => {
  await authorize(page, scenario);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Agendar sessão', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Agendar uma sessão' });
  await dialog.getByLabel('Nome do encontro').fill('Conversa de sexta');
  await dialog.getByLabel('Data e hora local').fill('2099-11-25T19:30');
  await dialog.getByRole('button', { name: 'Agendar sessão', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const call = scenario.calls.find((call) => call.path === '/ciclos/42/reunioes');
  expect(call?.body).toMatchObject({ reuniao: { data_hora: '2099-11-25T22:30:00.000Z' } });
  await page.getByRole('button', { name: 'Remover encontro Conversa de sexta' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Remover este encontro?' });
  await confirmation.getByRole('button', { name: 'Remover encontro', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Conversa de sexta', exact: true }),
  ).not.toBeVisible();
});

test('erros de carregamento oferecem recuperação e 401 limpa a sessão', async ({
  page,
  scenario,
}) => {
  scenario.dashboardFailures = 1;
  await authorize(page, scenario);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Seu clube não carregou' })).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Filmes deste ciclo' })).toBeVisible();
  scenario.expireProfile = true;
  await page.getByRole('button', { name: /ana.cinema/ }).click();
  await page.getByRole('link', { name: 'Meu perfil', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirect/);
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBeNull();
});

test('rota antiga de indicação redireciona sem enviar vaga zero', async ({ page, scenario }) => {
  await authorize(page, scenario);
  await page.goto('/adicionar-filme');
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(scenario.calls.filter((call) => call.path.includes('salvar_filme'))).toHaveLength(0);
});

test('formulários de acesso funcionam em 320 pixels e passam na auditoria de acessibilidade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const route of ['/login', '/register']) {
    await page.goto(route);
    await expect(page.locator('main h1').last()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
    ).toBe(false);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});

test('dashboard mantém navegação e ações alcançáveis com texto ampliado', async ({
  page,
  scenario,
}) => {
  await authorize(page, scenario);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Filmes deste ciclo' })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
  ).toBe(false);
  await page.getByRole('button', { name: 'Indicar meu filme' }).click();
  await expect(page.getByRole('dialog', { name: 'Indicar um filme' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('telas principais não têm erros de execução, vazamento horizontal ou violações WCAG', async ({
  page,
  scenario,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await authorize(page, scenario);
  for (const route of ['/dashboard', '/filmes', '/historico', '/perfil', '/clube/1/estatisticas']) {
    await page.goto(route);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('.state-loading')).toHaveCount(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect.soft(overflow, route + ' não deve causar rolagem horizontal').toBe(false);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect.soft(result.violations, route).toEqual([]);
    await page.screenshot({
      path: info.outputPath(route.replaceAll('/', '-') + '.png'),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
