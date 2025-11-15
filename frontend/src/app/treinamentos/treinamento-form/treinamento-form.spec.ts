import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinamentoForm  } from './treinamento-form';

describe('TreinamentoForm', () => {
  let component: TreinamentoForm;
  let fixture: ComponentFixture<TreinamentoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinamentoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreinamentoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
