import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoFilmes } from './catalogo-filmes';

describe('CatalogoFilmes', () => {
  let component: CatalogoFilmes;
  let fixture: ComponentFixture<CatalogoFilmes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoFilmes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoFilmes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
