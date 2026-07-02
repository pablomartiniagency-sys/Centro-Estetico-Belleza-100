import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, take, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return supabase.currentProfile$.pipe(
    // We wait until the profile is loaded or determined to be null
    // But since it's an observable, if it's null because we just refreshed, we might need a small delay or check session.
    // For simplicity:
    take(1),
    map(profile => {
      if (profile && profile.role === 'admin') {
        return true;
      }
      return router.createUrlTree(['/']);
    })
  );
};
