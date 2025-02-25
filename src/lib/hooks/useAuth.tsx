
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Optimizamos el fetch del perfil usando useCallback para memorizar la función
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      setProfile(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Error al obtener el perfil");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener tu perfil. Por favor, recarga la página.",
      });
    }
  }, [toast]);

  // Optimizamos el refresco de sesión con useCallback para evitar recreaciones innecesarias
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Session refresh error:", err);
      toast({
        variant: "destructive",
        title: "Error de sesión",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, toast]);

  useEffect(() => {
    let mounted = true;
    let inactivityTimer: NodeJS.Timeout;

    // Función para resetear el temporizador de inactividad
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      // Si hay un usuario activo, configuramos un temporizador de inactividad (30 minutos)
      if (user) {
        inactivityTimer = setTimeout(() => {
          console.log('Sesión inactiva por 30 minutos, refrescando...');
          refreshSession();
        }, 30 * 60 * 1000); // 30 minutos
      }
    };

    // Inicializar sesión al cargar
    const initializeAuth = async () => {
      await refreshSession();
      if (mounted) resetInactivityTimer();
    };

    initializeAuth();

    // Configurar refresco periódico más frecuente (2 minutos en lugar de 4)
    const intervalId = setInterval(() => {
      console.log('Refrescando sesión periódicamente...');
      refreshSession();
      if (mounted) resetInactivityTimer();
    }, 2 * 60 * 1000); // Cada 2 minutos

    // Suscribirse a cambios de autenticación con manejo optimizado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        resetInactivityTimer();
      }
    );

    // Agregar detectores de actividad del usuario para reiniciar el temporizador
    const handleUserActivity = () => {
      if (mounted) resetInactivityTimer();
    };

    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      clearTimeout(inactivityTimer);
      subscription.unsubscribe();
      
      // Eliminar detectores de eventos al desmontar
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [refreshSession, user]);

  // Optimizamos signOut para hacerlo más rápido
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Limpiar el estado de usuario y perfil inmediatamente para UI más responsiva
      setUser(null);
      setProfile(null);
      
      // Entonces hacer la solicitud real de cierre de sesión
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Error signing out:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar sesión. Por favor, intenta nuevamente.",
      });
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
    refreshSession, // Exponemos esta función para permitir refrescos manuales si es necesario
  };
};
