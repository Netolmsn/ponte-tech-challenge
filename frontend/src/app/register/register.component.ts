import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  private apiUrl = environment.apiUrl;

  registerForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  errorMessage: string | null = null;
  hidePassword = true;
  hideConfirmPassword = true;

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Preencha os campos obrigatórios corretamente.';
      this.snackBar.open(this.errorMessage, 'Fechar', { duration: 3000 });
      return;
    }

    const { nome, email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'As senhas não conferem.';
      this.snackBar.open(this.errorMessage, 'Fechar', { duration: 3000 });
      return;
    }

    const payload = {
      nome: nome!,
      email: email!,
      password: password!,
    };

    this.http.post(`${this.apiUrl}/auth/register/`, payload).subscribe({
      next: () => {
        this.snackBar.open('Cadastro realizado com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erro no cadastro:', err);
        this.errorMessage = 'Erro ao realizar cadastro. Verifique os dados.';

        if (err.error && typeof err.error === 'object') {
          const firstKey = Object.keys(err.error)[0];
          const firstMsg = Array.isArray(err.error[firstKey])
            ? err.error[firstKey][0]
            : err.error[firstKey];
          if (typeof firstMsg === 'string') {
            this.errorMessage = firstMsg;
          }
        }

        this.snackBar.open(this.errorMessage, 'Fechar', { duration: 4000 });
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
