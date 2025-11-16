import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  errorMessage: string | null = null;
  hidePassword = true;

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Preencha os campos obrigatórios corretamente.';
      this.snackBar.open(this.errorMessage, 'Fechar', { duration: 3000 });
      return;
    }

    const { email, password } = this.loginForm.value;
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.router.navigate(['/tarefas']);
      },
      error: (err) => {
        this.errorMessage = 'Falha no login. Verifique suas credenciais.';
        this.snackBar.open(this.errorMessage, 'Fechar', { duration: 3000 });
        console.error('Login error:', err);
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToBackendLogin(): void {
    window.location.href = 'http://localhost:8080/admin/login/';
  }
}
