import { Alert, Status } from "@/types/alert";
import useAlertApi from "./useAlertApi";
import { produce } from "immer";

const useAlert = () => {
  const api = useAlertApi();

  const { data: alerts, mutate: mutateAlerts } = api.getAlerts();

  return {
    alerts,
    getAlert: async (alertId: string) => {
      return (await api.getAlert(alertId)).data;
    },
    deleteAlert: (alertId: string) => {
      mutateAlerts(
        produce(alerts, (draft) => {
          const index = draft?.findIndex((alert) => alert.id === alertId) ?? -1;
          if (index !== -1) {
            draft?.splice(index, 1);
          }
        }),
        { revalidate: false }
      );
      return api.deleteAlert(alertId).finally(() => {
        mutateAlerts();
      });
    },
    createDummyAlert: () => {
      return api.createDummyAlert().then((response) => {
        mutateAlerts(
          produce(alerts, (draft) => {
            draft?.unshift(response.data);
          }),
          { revalidate: false }
        );
        return response;
      });
    },
    clearAlerts: () => {
      mutateAlerts([], { revalidate: false });
      return api.clearAlerts().finally(() => {
        mutateAlerts();
      });
    },
    updateAlertStatus: (alertId: string, status: Status) => {
      mutateAlerts(
        produce(alerts, (draft) => {
          const alert = draft?.find((a) => a.id === alertId);
          if (alert) {
            alert.status = status as Alert["status"];
          }
        }),
        { revalidate: false }
      );
      return api.updateAlertStatus(alertId, status).finally(() => {
        mutateAlerts();
      });
    },
    closeWithComment: (alertId: string, comment: string) => {
      mutateAlerts(
        produce(alerts, (draft) => {
          const alert = draft?.find((a) => a.id === alertId);
          if (alert) {
            alert.status = "CLOSED";
            alert.comment = comment;
            alert.closedAt = new Date().toISOString();
          }
        }),
        { revalidate: false }
      );
      return api.closeWithComment(alertId, comment).finally(() => {
        mutateAlerts();
      });
    },
  };
};

export default useAlert;
