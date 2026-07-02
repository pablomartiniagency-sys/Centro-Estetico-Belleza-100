import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, take } from 'rxjs/operators';

export const authGuard = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return supabase.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }
      // If not logged in, redirect to reservar or a login page
      return router.createUrlTree(['/reservar']);
    })
  );
};
