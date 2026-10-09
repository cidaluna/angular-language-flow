import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourGuide } from './tour-guide';

describe('TourGuide', () => {
  let component: TourGuide;
  let fixture: ComponentFixture<TourGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(TourGuide);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
