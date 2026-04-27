import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubeSetup } from './clube-setup';

describe('ClubeSetup', () => {
  let component: ClubeSetup;
  let fixture: ComponentFixture<ClubeSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubeSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubeSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
