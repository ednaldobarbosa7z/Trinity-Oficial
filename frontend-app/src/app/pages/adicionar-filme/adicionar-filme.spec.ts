import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarFilme } from './adicionar-filme';

describe('AdicionarFilme', () => {
  let component: AdicionarFilme;
  let fixture: ComponentFixture<AdicionarFilme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdicionarFilme]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdicionarFilme);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
