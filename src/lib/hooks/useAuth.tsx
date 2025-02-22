
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el perfil del usuario
  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      console.log("Profile data received:", data);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error("Error in fetchProfile:", err);
      setError("Error al obtener el perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("Auth effect running");

    const initialize = async () => {
      try {
        console.log("Initializing auth");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!mounted) {
          console.log("Component unmounted, stopping initialization");
          return;
        }

        console.log("Session status:", session ? "Active" : "No session");
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initialize:", err);
        setError("Error al inicializar la autenticación");
        setLoading(false);
      }
    };

    // Establecer un timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (loading && mounted) {
        console.log("Auth timeout reached, forcing loading state to false");
        setLoading(false);
        setError("Tiempo de espera agotado");
      }
    }, 5000); // 5 segundos de timeout máximo

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log("Cleaning up auth effect");
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("Signing out");
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setError(null);
    } catch (err) {
      console.error("Error in signOut:", err);
      setError("Error al cerrar sesión");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    signOut,
  };
};
