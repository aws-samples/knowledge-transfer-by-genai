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

// const useAlert = () => {
//   const alerts: Alert[] = [
//     {
//       id: "1",
//       name: "Alert 1",
//       description: "This is alert 1",
//       openedAt: "2021-08-01",
//       closedAt: "2021-08-02",
//       status: "OPEN",
//       severity: "CRITICAL",
//       comment: "",
//       meetingIds: [],
//     },
//     {
//       id: "2",
//       name: "Alert 2",
//       description: "This is alert 2",
//       openedAt: "2021-08-01",
//       closedAt: "2021-08-02",
//       status: "CLOSED",
//       severity: "HIGH",
//       comment: "This is a comment",
//       meetingIds: [],
//     },
//     {
//       id: "3",
//       name: "Alert 3",
//       description: "This is alert 3",
//       openedAt: "2021-08-01",
//       closedAt: "2021-08-02",
//       status: "OPEN",
//       severity: "MEDIUM",
//       comment: "",
//       meetingIds: [],
//     },
//     {
//       id: "4",
//       name: "Alert 4",
//       description: "This is alert 4",
//       openedAt: "2021-08-01",
//       closedAt: "2021-08-02",
//       status: "CLOSED",
//       severity: "LOW",
//       comment: "This is a comment",
//       meetingIds: [],
//     },
//   ];

//   const updateAlert = (alert: Alert) => {
//     console.log(`Updating alert ${alert.id}`);
//     return;
//   };

//   return {
//     alerts,
//     updateAlert,
//   };
// };
export default useAlert;
