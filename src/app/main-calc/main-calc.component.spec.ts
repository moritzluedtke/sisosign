import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainCalcComponent } from './main-calc.component';

describe('MainCalcComponent', () => {
  let component: MainCalcComponent;
  let fixture: ComponentFixture<MainCalcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainCalcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainCalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
