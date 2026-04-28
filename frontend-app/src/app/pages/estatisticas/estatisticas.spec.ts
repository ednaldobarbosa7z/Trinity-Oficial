import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Estatisticas } from './estatisticas';

describe('Estatisticas', () => {
  let component: Estatisticas;
  let fixture: ComponentFixture<Estatisticas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Estatisticas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Estatisticas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
