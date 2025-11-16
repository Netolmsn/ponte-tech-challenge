import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../core/auth/auth.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authService: jest.Mocked<AuthService>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const authSpy: Partial<jest.Mocked<AuthService>> = {
      login: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;

    // Evita erro de rota ao navegar para '/tarefas' nos testes
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);

    // Silencia console.error para não poluir saída de teste
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar formulário inválido', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('deve chamar AuthService.login ao submeter formulário válido', () => {
    const email = 'user@teste.com';
    const password = 'SenhaValida1';

    component.loginForm.setValue({
      email,
      password,
      rememberMe: false,
    });

    authService.login.mockReturnValue(
      of({ access: 'token', refresh: 'ref' } as any),
    );

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ email, password });
  });

  it('não deve chamar login se formulário inválido', () => {
    component.loginForm.setValue({
      email: '',
      password: '',
      rememberMe: false,
    });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('deve definir mensagem de erro em falha de login', () => {
    component.loginForm.setValue({
      email: 'user@teste.com',
      password: 'SenhaValida1',
      rememberMe: false,
    });

    authService.login.mockReturnValue(throwError(() => new Error('erro')));

    component.onSubmit();

    expect(component.errorMessage).toBeTruthy();
  });
});
