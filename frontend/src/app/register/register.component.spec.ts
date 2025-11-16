import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { RegisterComponent } from './register.component';
import { environment } from '../../environments/environment';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Evita erro de rota ao navegar para '/login' nos testes
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve enviar requisição de cadastro quando formulário é válido', () => {
    component.registerForm.setValue({
      nome: 'Usuário Teste',
      email: 'user@teste.com',
      password: 'SenhaValida1',
      confirmPassword: 'SenhaValida1',
    });

    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register/`);
    expect(req.request.method).toBe('POST');
  });
});
