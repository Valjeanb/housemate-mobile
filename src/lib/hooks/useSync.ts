// Realtime sync hook using React Query + Supabase Realtime
import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "../supabase";
import { fetchSync, fetchSyncSince } from "../api";
import useAppStore from "../state/app-store";

export function useSync() {
  const queryClient = useQueryClient();
  const lastSyncRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  const syncFromServer = useAppStore((s) => s.syncFromServer);
  const mergeSyncUpdate = useAppStore((s) => s.mergeSyncUpdate);

  // Initial full sync
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sync"],
    queryFn: async () => {
      const data = await fetchSync();
      syncFromServer(data);
      lastSyncRef.current = data.lastModified;
      isInitializedRef.current = true;
      return data;
    },
    staleTime: 30000, // 30 seconds
    retry: 3,
  });

  // Polling for changes every 15 seconds
  useQuery({
    queryKey: ["sync-poll"],
    queryFn: async () => {
      if (!lastSyncRef.current || !isInitializedRef.current) return null;

      const update = await fetchSyncSince(lastSyncRef.current);
      if (update.changed) {
        mergeSyncUpdate(update);
        lastSyncRef.current = update.lastModified;
      }
      return update;
    },
    refetchInterval: 15000, // Poll every 15 seconds
    enabled: isInitializedRef.current,
  });

  // Supabase Realtime subscriptions for instant updates
  useEffect(() => {
    const channel = supabase
      .channel("housemate-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_completions" },
        () => {
          // When completions change, refetch sync
          if (lastSyncRef.current) {
            fetchSyncSince(lastSyncRef.current).then((update) => {
              if (update.changed) {
                mergeSyncUpdate(update);
                lastSyncRef.current = update.lastModified;
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completion_logs" },
        () => {
          if (lastSyncRef.current) {
            fetchSyncSince(lastSyncRef.current).then((update) => {
              if (update.changed) {
                mergeSyncUpdate(update);
                lastSyncRef.current = update.lastModified;
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          if (lastSyncRef.current) {
            fetchSyncSince(lastSyncRef.current).then((update) => {
              if (update.changed) {
                mergeSyncUpdate(update);
                lastSyncRef.current = update.lastModified;
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mergeSyncUpdate]);

  // Re-sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && lastSyncRef.current) {
        fetchSyncSince(lastSyncRef.current).then((update) => {
          if (update.changed) {
            mergeSyncUpdate(update);
            lastSyncRef.current = update.lastModified;
          }
        }).catch(() => {}); // Silently fail on network errors
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [mergeSyncUpdate]);

  return {
    isLoading,
    isInitialized: isInitializedRef.current,
    error,
    refetch,
    lastSync: lastSyncRef.current,
  };
}
