import { useQueryClient } from "@tanstack/react-query";

export function useRefresh(queryKeys) {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (Array.isArray(queryKeys)) {
      await Promise.all(
        queryKeys.map((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        )
      );
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys });
    }
  };

  return handleRefresh;
}