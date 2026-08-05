import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('cockpit_jwt') || sessionStorage.getItem('cockpit_jwt');
  return true;
};
