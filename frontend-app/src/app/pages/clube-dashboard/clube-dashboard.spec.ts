import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubeDashboard } from './clube-dashboard';

describe('ClubeDashboard', () => {
  let component: ClubeDashboard;
  let fixture: ComponentFixture<ClubeDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubeDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubeDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
