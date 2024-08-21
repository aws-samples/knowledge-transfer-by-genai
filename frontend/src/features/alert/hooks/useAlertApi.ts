import { Alert, Status } from "@/types/alert";
import useHttp from "@/hooks/useHttp";
import { MutatorCallback, useSWRConfig } from "swr";

const useAlertApi = () => {
  const http = useHttp();
  const { mutate } = useSWRConfig();

  return {
    getAlerts: () => {
      return http.get<Alert[]>("/alert", {});
    },

    getAlert: (alertId: string) => {
      return http.get<Alert>(`/alert/${alertId}`, { keepPreviousData: true });
    },

    deleteAlert: (alertId: string) => {
      return http.delete(`/alert/${alertId}`);
    },

    clearAlerts: () => {
      return http.delete("/alert");
    },

    updateAlertStatus: (alertId: string, status: Status) => {
      return http.patch(`/alert/${alertId}/status`, { status });
    },

    closeWithComment: (alertId: string, comment: string) => {
      return http.patch(`/alert/${alertId}/close`, { comment });
    },

    mutateAlerts: (
      alerts?: Alert[] | Promise<Alert[]> | MutatorCallback<Alert[]>,
      options?: Parameters<typeof mutate>[2]
    ) => {
      return mutate("/alert", alerts, options);
    },
  };
};

export default useAlertApi;
