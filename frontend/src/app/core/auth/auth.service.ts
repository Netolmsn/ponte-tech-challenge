import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, tap, catchError, switchMap, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  access: string;
  refresh: string;
}

export interface UserDto {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface MeResponse {
  user: UserDto;
  perfil: { id: number; nome: string } | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _isAuthenticated = signal<boolean>(this.hasValidTokens());
  isAuthenticated = this._isAuthenticated.asReadonly();

  private _currentUser = signal<MeResponse | null>(null);
  currentUser = this._currentUser.asReadonly();

  private isRefreshingToken = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);


  private hasValidTokens(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('access_token') && !!localStorage.getItem('refresh_token');
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/`, credentials).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      tap(() => this._isAuthenticated.set(true)),
      switchMap((tokens) =>
        this.me().pipe(
          catchError(() => of(null)),
          map(() => tokens)
        )
      ),
      catchError((error) => {
        console.error('Login failed:', error);
        this.clearTokens();
        this._isAuthenticated.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('access_token');
  }

   getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('refresh_token');
  }

  refreshToken(): Observable<string | null> {
     if (this.isRefreshingToken) {
       return this.refreshTokenSubject.pipe(
         switchMap(token => token ? of(token) : throwError(() => 'Refresh already failed'))
       );
     }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => 'No refresh token available');
    }

    this.isRefreshingToken = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/token/refresh/`, { refresh: refreshToken })
    .pipe(
      tap((tokens) => {
        this.storeTokens(tokens);
        this.refreshTokenSubject.next(tokens.access);
      }),
      catchError((error) => {
         console.error('Refresh token failed:', error);
         this.logout();
         this.refreshTokenSubject.error('Refresh token failed');
         return throwError(() => error);
      }),
      tap({
        next: () => this.isRefreshingToken = false,
        error: () => this.isRefreshingToken = false,
        complete: () => this.isRefreshingToken = false
      }),
      switchMap(() => of(this.getAccessToken()))
    );
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me/`).pipe(
      tap((me) => this._currentUser.set(me))
    );
  }

  private storeTokens(tokens: AuthResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private clearTokens(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private getTokens(): { access: string; refresh: string } | null {
    if (!this.isBrowser) return null;
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return access && refresh ? { access, refresh } : null;
  }
}
