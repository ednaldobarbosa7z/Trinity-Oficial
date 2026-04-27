import { TestBed } from '@angular/core/testing';

import { Clube } from './clube';

describe('Clube', () => {
  let service: Clube;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Clube);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
