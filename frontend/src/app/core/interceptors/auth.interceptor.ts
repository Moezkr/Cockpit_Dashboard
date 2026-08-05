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
      return throwError(() => error);
    })
  );
};
