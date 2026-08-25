import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type EntityType = "flyer" | "post" | "blog";

export function LikeButton({
  entityType,
  entityId,
  count,
  invalidateKey,
}: {
  entityType: EntityType;
  entityId: string;
  count: number;
  invalidateKey: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: liked } = useQuery({
    queryKey: ["like", entityType, entityId, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return Boolean(data);
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("sign-in-required");
      if (liked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ entity_type: entityType, entity_id: entityId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["like", entityType, entityId, user?.id] });
      void queryClient.invalidateQueries({ queryKey: [invalidateKey] });
    },
    onError: (error: Error) => {
      toast.error(error.message === "sign-in-required" ? "Sign in to like this" : "Could not save your like");
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1.5", liked && "text-live")}
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      {count}
    </Button>
  );
}
