import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const accessToken = authService.getAccessToken();

  const isAuthEndpoint = req.url.includes('/auth/token');
  const isRefreshEndpoint = req.url.includes('/auth/token/refresh');

  let authReq = req;
  if (accessToken && !isAuthEndpoint && !isRefreshEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !authReq.url.includes('/auth/token') &&
        !authReq.url.includes('/auth/token/refresh')
      ) {
        return handle401Error(authReq, next, authService, snackBar);
      }
      return throwError(() => error);
    }),
  );
};

const handle401Error = (
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    authService: AuthService,
    snackBar: MatSnackBar,
  ): Observable<HttpEvent<any>> => {

    return authService.refreshToken().pipe(
       switchMap((newAccessToken) => {
         if (newAccessToken) {
           const newReq = req.clone({
             setHeaders: {
               Authorization: `Bearer ${newAccessToken}`
             }
           });
           return next(newReq);
         } else {
           return throwError(() => new Error('Failed to refresh token'));
         }
       }),
       catchError((refreshError) => {
         snackBar.open(
           'Sua sessão expirou. Faça login novamente.',
           'Fechar',
           { duration: 4000 },
         );
         authService.logout();
         return throwError(() => refreshError);
       })
     );
  };
