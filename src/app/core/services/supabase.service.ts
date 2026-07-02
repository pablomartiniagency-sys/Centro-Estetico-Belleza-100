import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Profile {
  id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'client' | 'admin';
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _session: AuthSession | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentProfileSubject = new BehaviorSubject<Profile | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  currentProfile$ = this.currentProfileSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
      this.updateCurrentUser(this._session?.user ?? null);
    });

    this.supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      this._session = session;
      this.updateCurrentUser(session?.user ?? null);
    });
  }

  get session() {
    return this._session;
  }

  get user() {
    return this.currentUserSubject.value;
  }

  get profile() {
    return this.currentProfileSubject.value;
  }

  private async updateCurrentUser(user: User | null) {
    this.currentUserSubject.next(user);
    if (user) {
      await this.loadProfile(user);
    } else {
      this.currentProfileSubject.next(null);
    }
  }

  private async loadProfile(user: User) {
    // Buscar perfil
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Perfil no existe, crearlo (usualmente pasa la primera vez que hace login con Google)
      const newProfile: Profile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || '',
        role: 'client' // Role se asigna por defecto. El admin se asigna manual en base de datos.
      };
      
      const { data: createdProfile, error: createError } = await this.supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();
        
      if (!createError) {
        this.currentProfileSubject.next(createdProfile);
      }
    } else if (profile) {
      this.currentProfileSubject.next(profile);
    }
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/reservar' // Redirige tras login
      }
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  // Métodos expuestos del cliente para consultas directas si fuera necesario
  getClient(): SupabaseClient {
    return this.supabase;
  }
}
