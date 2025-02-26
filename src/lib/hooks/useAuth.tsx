
import { useEffect, useState, useCallback, useRef } from "react";
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
  
  // Referencia para controlar los temporizadores y evitar fugas de memoria
  const timersRef = useRef<{
    inactivity: NodeJS.Timeout | null;
    refresh: NodeJS.Timeout | null;
  }>({
    inactivity: null,
    refresh: null
  });

  // Control de estado para evitar actualizaciones después de desmontar
  const mountedRef = useRef(true);

  // Optimizamos el fetch del perfil usando useCallback para memorizar la función
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (mountedRef.current) {
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (mountedRef.current) {
        setError("Error al obtener el perfil");
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener tu perfil. Por favor, recarga la página.",
        });
      }
    }
  }, [toast]);

  // Optimizamos el refresco de sesión con useCallback
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (mountedRef.current) {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    } catch (err) {
      console.error("Session refresh error:", err);
      if (mountedRef.current) {
        toast({
          variant: "destructive",
          title: "Error de sesión",
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchProfile, toast]);

  // Función para resetear el temporizador de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (timersRef.current.inactivity) {
      clearTimeout(timersRef.current.inactivity);
    }
    
    // Si hay un usuario activo, configuramos un temporizador de inactividad (30 minutos)
    if (user && mountedRef.current) {
      timersRef.current.inactivity = setTimeout(() => {
        console.log('Sesión inactiva por 30 minutos, refrescando...');
        refreshSession();
      }, 30 * 60 * 1000); // 30 minutos
    }
  }, [user, refreshSession]);

  // Optimizamos signOut para hacerlo más rápido y evitar bloqueos
  const signOut = useCallback(async () => {
    try {
      // Limpiamos temporizadores para evitar operaciones después del cierre de sesión
      if (timersRef.current.inactivity) {
        clearTimeout(timersRef.current.inactivity);
      }
      if (timersRef.current.refresh) {
        clearInterval(timersRef.current.refresh);
      }
      
      // Limpiar inmediatamente el estado para UI más responsiva
      if (mountedRef.current) {
        setUser(null);
        setProfile(null);
      }
      
      // Entonces hacer la solicitud real de cierre de sesión (sin esperar)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Error signing out:", err);
      if (mountedRef.current) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cerrar sesión correctamente. La sesión se ha cerrado localmente.",
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [toast]);

  // Hook de efecto para manejar la autenticación
  useEffect(() => {
    mountedRef.current = true;

    // Inicializar sesión con timeout para evitar bloqueos infinitos
    const initTimeout = setTimeout(() => {
      if (loading && mountedRef.current) {
        setLoading(false);
        setError("No se pudo conectar en un tiempo razonable");
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "La conexión está tardando demasiado. Por favor, intenta más tarde.",
        });
      }
    }, 15000); // 15 segundos máximo para la inicialización

    // Inicializar sesión al cargar
    const initializeAuth = async () => {
      await refreshSession();
      if (mountedRef.current) resetInactivityTimer();
      clearTimeout(initTimeout); // Limpiamos el timeout si la inicialización fue exitosa
    };

    initializeAuth();

    // Configurar refresco periódico (cada 2 minutos)
    timersRef.current.refresh = setInterval(() => {
      if (mountedRef.current) {
        console.log('Refrescando sesión periódicamente...');
        refreshSession();
        resetInactivityTimer();
      }
    }, 2 * 60 * 1000);

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

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

    // Detectores de actividad del usuario
    const handleUserActivity = () => {
      if (mountedRef.current) resetInactivityTimer();
    };

    // Agregar detectores de eventos para reiniciar el temporizador
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Limpiar recursos al desmontar
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
      
      if (timersRef.current.refresh) {
        clearInterval(timersRef.current.refresh);
      }
      
      if (timersRef.current.inactivity) {
        clearTimeout(timersRef.current.inactivity);
      }
      
      subscription.unsubscribe();
      
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [refreshSession, resetInactivityTimer, loading, fetchProfile, toast]);

  return {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshSession,
  };
};
