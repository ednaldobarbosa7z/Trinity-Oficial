import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReviewFormComponent } from './review-form';
import { CycleFormComponent } from './cycle-form';
import { MeetingFormComponent } from './meeting-form';
import { environment } from '../../environments/environment';
import { Film } from '../models/api.models';

describe('Formulários e preservação de dados após erro', () => {
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    backend.verify();
    TestBed.resetTestingModule();
  });
  it('exige comentário e nota e não repete publicação enquanto aguarda resposta', () => {
    const component = TestBed.runInInjectionContext(() => new ReviewFormComponent());
    component.film = { id: 9, titulo: 'Filme' } as Film;
    component.cycleId = 3;
    component.submit();
    backend.expectNone(environment.apiUrl + '/avaliacoes');
    component.form.patchValue({ nota: 4.5, comentario: 'Uma história muito boa.' });
    component.submit();
    component.submit();
    const requests = backend.match(environment.apiUrl + '/avaliacoes');
    expect(requests).toHaveLength(1);
    requests[0].flush(
      { errors: ['Você já avaliou este filme.'] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    expect(component.saving()).toBe(false);
    expect(component.error()).toContain('já avaliou');
    expect(component.form.controls.comentario.value).toBe('Uma história muito boa.');
  });
  it('recusa vagas fracionárias e valores além do limite', () => {
    const component = TestBed.runInInjectionContext(() => new CycleFormComponent());
    component.clubId = 2;
    for (const value of [0, 101, 2.5]) {
      component.form.controls.qtd_slots.setValue(value);
      component.submit();
    }
    backend.expectNone((request) => request.method === 'POST');
    component.form.patchValue({ qtd_slots: 4, mes: 2, ano: 2027 });
    component.submit();
    const request = backend.expectOne(environment.apiUrl + '/clubes/2/ciclos/mensal');
    expect(request.request.body.ciclo.mes).toBe(2);
    request.flush({});
  });
  it('recusa links executáveis antes de agendar uma reunião online', () => {
    const component = TestBed.runInInjectionContext(() => new MeetingFormComponent());
    component.cycleId = 3;
    component.form.patchValue({
      titulo: 'Sessão',
      data_hora: '2099-11-25T19:30',
      link_ou_local: 'javascript:alert(1)',
    });
    component.submit();
    backend.expectNone((request) => request.method === 'POST');
    expect(component.error()).toContain('https://');
    component.form.controls.link_ou_local.setValue('https://example.com/sessao');
    component.submit();
    const request = backend.expectOne(environment.apiUrl + '/ciclos/3/reunioes');
    expect(request.request.body.reuniao.data_hora).toMatch(/^2099-11-/);
    request.flush({});
  });
});
