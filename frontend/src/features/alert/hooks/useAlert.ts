import { Alert } from "@/types/alert";

const useAlert = () => {
  const alerts: Alert[] = [
    {
      id: "1",
      name: "Alert 1",
      description: "This is alert 1",
      openedAt: "2021-08-01",
      closedAt: "2021-08-02",
      status: "OPEN",
      severity: "CRITICAL",
      comment: "",
      meetings: [],
    },
    {
      id: "2",
      name: "Alert 2",
      description: "This is alert 2",
      openedAt: "2021-08-01",
      closedAt: "2021-08-02",
      status: "CLOSED",
      severity: "HIGH",
      comment: "This is a comment",
      meetings: [],
    },
    {
      id: "3",
      name: "Alert 3",
      description: "This is alert 3",
      openedAt: "2021-08-01",
      closedAt: "2021-08-02",
      status: "OPEN",
      severity: "MEDIUM",
      comment: "",
      meetings: [],
    },
    {
      id: "4",
      name: "Alert 4",
      description: "This is alert 4",
      openedAt: "2021-08-01",
      closedAt: "2021-08-02",
      status: "CLOSED",
      severity: "LOW",
      comment: "This is a comment",
      meetings: [],
    },
  ];

  const updateAlert = (alert: Alert) => {
    console.log(`Updating alert ${alert.id}`);
    return;
  };

  return {
    alerts,
    updateAlert,
  };
};
export default useAlert;
