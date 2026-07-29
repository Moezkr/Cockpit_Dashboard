import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('cockpit_jwt') || sessionStorage.getItem('cockpit_jwt');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Unauthorized access (401) - Authentication required by host app');
      } else if (error.status === 403) {
        console.warn('Forbidden access (403) - Insufficient permissions');
      } else if (error.status === 400) {
        console.error('Bad Request (400) - Data validation error', error.error);
      }
      return throwError(() => error);
    })
  );
};
