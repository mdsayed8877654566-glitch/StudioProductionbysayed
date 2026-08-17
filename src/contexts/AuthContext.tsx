import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { storeService } from '../services/storeService';
import { supabase, isSupabaseConfigured, fetchProfileFromSupabase, fetchProfileByEmailFromSupabase, upsertProfileInSupabase, initialSessionPromise } from '../lib/supabase';
import { 
  fetchUsersFromFirestore, 
  fetchUserFromFirestore,
  upsertUserInFirestore 
} from '../lib/firestoreService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (perm: string) => boolean;
  isLoading: boolean;
  pendingEmailVerification: string | null;
  currentOtp: string | null;
  returnTab: string | null;
  setReturnTab: (tab: string | null) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password?: string) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithToken: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  generateAndSendOtp: (email: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: { name?: string; avatar?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserProfile['role']) => Promise<void>;
  setPendingEmailVerification: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const generateDisplayId = (users: UserProfile[]): string => {
  const ids = users.map(u => u.displayId).filter(Boolean) as string[];
  if (ids.length === 0) return '0000001';
  const nums = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
  const max = Math.max(0, ...nums);
  return String(max + 1).padStart(7, '0');
};

export const SUPER_ADMIN_EMAIL = 'mdsayed8877654566@gmail.com';

const normalizeUserRole = (profile: UserProfile | null): UserProfile | null => {
  if (!profile) return null;
  const isSuperAdminEmail = Boolean(
    profile.email && profile.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );
  if (isSuperAdminEmail) {
    return { ...profile, role: 'super_admin' };
  }
  return profile;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userState, setUserState] = useState<UserProfile | null>(null);

  const setUser = (p: UserProfile | null) => {
    const normalized = normalizeUserRole(p);
    setUserState(normalized);
  };

  const user = userState;
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true); // start true while checking session
  const [pendingEmailVerification, setPendingEmailVerification] = useState<string | null>(null);
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [returnTab, setReturnTab] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        // 1. Check Supabase session first if configured
        if (isSupabaseConfigured) {
          const { data: { session } } = await initialSessionPromise;
          if (session?.user) {
            const sbUser = session.user;
            setIsEmailVerified(Boolean(sbUser.email_confirmed_at));
            
            // Set temporary basic user info immediately from session metadata to unblock loading spinner instantly
            const tempProfile: UserProfile = {
              id: sbUser.id,
              displayId: '0000001',
              email: sbUser.email || '',
              name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Customer',
              avatar: sbUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              role: 'customer',
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              totalOrders: 0,
              totalSpent: 0
            };
            setUser(tempProfile);
            setIsLoading(false); // Unblock loading screen immediately!

            // Now, fetch the authoritative profile from Firestore/Supabase in the background
            try {
              const cloudProfile = await fetchUserFromFirestore(sbUser.id);
              if (cloudProfile) {
                setUser(cloudProfile);
                await storeService.saveUserVerified(cloudProfile);
              } else {
                let sbProfile = await fetchProfileFromSupabase(sbUser.id);
                if (sbProfile) {
                  setUser(sbProfile);
                  await storeService.saveUserVerified(sbProfile);
                } else {
                  await storeService.saveUserVerified(tempProfile);
                  await upsertProfileInSupabase({ id: tempProfile.id, email: tempProfile.email, name: tempProfile.name, avatar: tempProfile.avatar, role: tempProfile.role, status: tempProfile.status });
                }
              }
            } catch (err) {
              console.warn("Background fetch of user profile failed:", err);
            }
            return;
          }
        }

        // 2. Fallback: Check local storage / session persistence
        const lastUser = localStorage.getItem('studio_collection_current_user');
        if (lastUser) {
          const parsed = JSON.parse(lastUser);
          setUser(parsed);
          setIsLoading(false); // Unblock loading screen immediately!

          // Fetch fresh status from Firestore in the background
          try {
            const liveUser = await fetchUserFromFirestore(parsed.id);
            if (liveUser) {
              setUser(liveUser);
            }
          } catch (err) {
            console.warn("Could not fetch user profile from Firestore during background check:", err);
          }
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsEmailVerified(true);
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        try {
          if (window.opener) {
            window.close();
          }
          const sbUser = session.user;
          setIsEmailVerified(Boolean(sbUser.email_confirmed_at));
          let sbProfile: UserProfile | null = await fetchProfileFromSupabase(sbUser.id);
          if (sbProfile) {
            setUser(sbProfile);
            await storeService.saveUserVerified(sbProfile);
          } else {
            const fallbackProfile: UserProfile = {
              id: sbUser.id,
              displayId: generateDisplayId(storeService.getUsers()),
              email: sbUser.email || '',
              name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Customer',
              avatar: sbUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              role: 'customer',
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              totalOrders: 0,
              totalSpent: 0
            };
            setUser(fallbackProfile);
            await storeService.saveUserVerified(fallbackProfile);
            await upsertProfileInSupabase({ id: fallbackProfile.id, email: fallbackProfile.email, name: fallbackProfile.name, avatar: fallbackProfile.avatar, role: fallbackProfile.role, status: fallbackProfile.status });
          }
        } catch(err) {
          console.error('Failed to handle auth state change', err);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    if (!password) {
      setIsLoading(false);
      return { success: false, error: 'Password is required for login.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setIsEmailVerified(Boolean(data.user.email_confirmed_at));
          let profile: UserProfile | null = await fetchProfileFromSupabase(data.user.id);
          
          if (!profile) {
            profile = {
              id: data.user.id,
              displayId: generateDisplayId(storeService.getUsers()),
              email: trimmedEmail,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || trimmedEmail.split('@')[0],
              avatar: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              role: 'customer',
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              totalOrders: 0,
              totalSpent: 0
            };
            await upsertProfileInSupabase({ id: profile.id, email: profile.email, name: profile.name, avatar: profile.avatar, role: profile.role, status: profile.status });
          }

          if (profile.status === 'disabled') {
            await supabase.auth.signOut();
            setIsLoading(false);
            return { success: false, error: 'Your account has been banned. You cannot place orders or access your account.' };
          }

          setUser(profile);
          await storeService.saveUserVerified(profile);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase signInWithPassword warning:', err);
      }
    }

    // Fallback: Check database profiles and local store users by email
    const dbProfile = await fetchProfileByEmailFromSupabase(trimmedEmail);
    const localUser = storeService.getUsers().find(u => u.email.toLowerCase() === trimmedEmail);
    const matchedProfile = dbProfile || localUser;

    if (matchedProfile) {
      if (matchedProfile.status === 'disabled') {
        setIsLoading(false);
        return { success: false, error: 'Your account has been banned. You cannot place orders or access your account.' };
      }
      setUser(matchedProfile);
      await storeService.saveUserVerified(matchedProfile);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: "Invalid email or password. Please check your credentials or create an account." };
  };

  const signup = async (name: string, email: string, password?: string): Promise<{ success: boolean; requiresVerification?: boolean; error?: string }> => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    
    // Automatically apply customer role symbol to new signups
    let cleanName = name.replace(/[👑🛡️🛠️📝👤]/g, '').trim();
    const finalName = `${cleanName} 👤`.trim();

    if (!password) {
      setIsLoading(false);
      return { success: false, error: 'Password is required for registration.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: finalName,
              name: finalName
            }
          }
        });

        if (error) {
          setIsLoading(false);
          if (error.message.includes('already registered') || error.message.toLowerCase().includes('already exists')) {
            return { success: false, error: 'An account with this email already exists. Please login instead.' };
          }
          return { success: false, error: error.message };
        }

        if (data?.user) {
          let profile: UserProfile | null = await fetchProfileFromSupabase(data.user.id);
          if (!profile) {
            profile = {
              id: data.user.id,
              displayId: generateDisplayId(storeService.getUsers()),
              email: trimmedEmail,
              name: finalName,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              role: 'customer',
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              totalOrders: 0,
              totalSpent: 0
            };
            await upsertProfileInSupabase({ id: profile.id, email: profile.email, name: profile.name, avatar: profile.avatar, role: profile.role, status: profile.status });
          }
          await storeService.saveUserVerified(profile);

          setUser(profile);
          setIsEmailVerified(true);
          setIsLoading(false);
          return { success: true, requiresVerification: false };
        }
      } catch (err: any) {
        console.warn('Supabase signUp warning:', err);
      }
    }

    // Fallback registration: Create user profile in storeService & DB profiles
    const newProfile: UserProfile = {
      id: 'usr-' + Date.now(),
      displayId: generateDisplayId(storeService.getUsers()),
      email: trimmedEmail,
      name: finalName,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'customer',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0
    };

    if (isSupabaseConfigured) {
      await upsertProfileInSupabase({ id: newProfile.id, email: newProfile.email, name: newProfile.name, avatar: newProfile.avatar, role: newProfile.role, status: newProfile.status });
    }

    await storeService.saveUserVerified(newProfile);
    setUser(newProfile);
    setIsEmailVerified(true);
    setIsLoading(false);
    return { success: true, requiresVerification: false };
  };

  const logout = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    setUser(null);
    setIsEmailVerified(true);
    setPendingEmailVerification(null);
    setIsLoading(false);
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        setIsLoading(false);
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        console.error('Password reset error:', err);
      }
    }
    setIsLoading(false);
    return { success: true };
  };

  const resetPasswordWithToken = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        setIsLoading(false);
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Failed to update password.' };
      }
    }
    setIsLoading(false);
    return { success: true };
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
    return generateAndSendOtp(email);
  };

  const generateAndSendOtp = async (email: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
    return { success: false, error: "Not implemented in pure Supabase Auth" };
  };

  const verifyOtp = async (code: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: "Not implemented in pure Supabase Auth" };
  };

  const loginWithOAuth = async (provider: 'google' | 'github'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true
          }
        });
        setIsLoading(false);
        if (error) {
          return { success: false, error: error.message };
        }
        if (data?.url) {
          const authWindow = window.open(data.url, 'oauth_popup', 'width=500,height=600');
          if (!authWindow) {
            return { success: false, error: 'Popup blocked. Please allow popups for this site to log in with ' + provider + '.' };
          }
          return new Promise((resolve) => {
             const timer = setInterval(() => {
               if (authWindow.closed) {
                 clearInterval(timer);
                 // Reload to apply the new session
                 window.location.reload();
               }
             }, 500);
          });
        }
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || `Failed to initiate ${provider} login.` };
      }
    }
    setIsLoading(false);
    return { 
      success: false, 
      error: `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth integration is ready. Configure Supabase credentials to activate live OAuth popup.` 
    };
  };

  const updateUserProfile = async (data: { name?: string; avatar?: string; email?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };
    const oldEmail = user.email.toLowerCase().trim();
    const newEmail = data.email ? data.email.toLowerCase().trim() : oldEmail;

    const updated: UserProfile = {
      ...user,
      name: data.name !== undefined && data.name.trim() ? data.name.trim() : user.name,
      avatar: data.avatar !== undefined ? data.avatar : user.avatar,
      email: newEmail
    };

    setUser(updated);
    await storeService.saveUserVerified(updated);

    if (isSupabaseConfigured) {
      await upsertProfileInSupabase({ id: updated.id, email: updated.email, name: updated.name, avatar: updated.avatar, role: updated.role, status: updated.status });
      
      try {
        const updatePayload: any = {
          data: {
            full_name: updated.name,
            name: updated.name,
            avatar_url: updated.avatar,
            avatar: updated.avatar
          }
        };
        if (newEmail !== oldEmail) {
          updatePayload.email = newEmail;
        }
        const { error: authErr } = await supabase.auth.updateUser(updatePayload);
        if (authErr) {
          console.warn('Supabase auth updateUser notice:', authErr.message);
        }
      } catch (e) {
        console.warn('Supabase auth updateUser exception:', e);
      }
    }
    return { success: true };
  };

  const switchRole = async (role: UserProfile['role']) => {
    if (!user) return;
    
    const roleSymbols: Record<string, string> = {
      super_admin: '👑',
      admin: '🛡️',
      moderator: '🛠️',
      editor: '📝',
      customer: '👤'
    };
    let cleanName = user.name.replace(/[👑🛡️🛠️📝👤]/g, '').trim();
    const finalName = `${cleanName} ${roleSymbols[role] || ''}`.trim();
    
    const updated: UserProfile = {
      ...user,
      role,
      name: finalName
    };
    setUser(updated);
    await storeService.saveUserVerified(updated);
  };

  const isSuperAdminEmail = Boolean(
    user && user.email && user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );
  const isAuthenticated = Boolean(user && user.status === 'active');
  const isSuperAdmin = Boolean(isSuperAdminEmail || user?.role === 'super_admin');
  const isAdmin = Boolean(isSuperAdmin || user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'editor');

  const hasPermission = (perm: string): boolean => {
    if (isSuperAdmin) return true;
    if (user?.role === 'admin') return true; // full admin access
    if (user?.role === 'moderator') {
      return user.permissions?.includes(perm) ?? false;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isEmailVerified,
        isAdmin,
        isSuperAdmin,
        hasPermission,
        isLoading,
        pendingEmailVerification,
        currentOtp,
        returnTab,
        setReturnTab,
        login,
        signup,
        logout,
        sendPasswordResetEmail,
        resetPasswordWithToken,
        resendVerificationEmail,
        generateAndSendOtp,
        verifyOtp,
        loginWithOAuth,
        updateUserProfile,
        switchRole,
        setPendingEmailVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
