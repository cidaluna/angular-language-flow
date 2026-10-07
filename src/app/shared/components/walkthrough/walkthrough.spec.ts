import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Walkthrough } from './walkthrough';

describe('Walkthrough', () => {
  let component: Walkthrough;
  let fixture: ComponentFixture<Walkthrough>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Walkthrough],
    }).compileComponents();

    fixture = TestBed.createComponent(Walkthrough);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
