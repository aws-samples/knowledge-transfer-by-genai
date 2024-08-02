import { createFileRoute, useLocation } from "@tanstack/react-router";
import CloseAlertDialog from "@/features/alert/components/CloseAlertDialog";
import Chat from "@/features/chat/components/Chat";
import AlertDetailCard from "@/features/alert/components/AlertDetailCard";
import ContactCard from "@/features/video-call/components/ContactCard";

import { ScrollArea } from "@/components/ui/scroll-area";
import useAlert from "@/features/alert/hooks/useAlert";

export const Route = createFileRoute("/_layout/alert/$alertId")({
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const location = useLocation();
  const { alerts, updateAlert } = useAlert();
  const alertId = location.pathname.split("/")[2];
  const alert =
    alertId && alerts ? alerts.find((alert) => alert.id === alertId) : null;

  const onCloseSubmit = (comment: string) => {
    if (alert) {
      updateAlert({
        ...alert,
        status: "CLOSED",
        closedAt: new Date().toISOString(),
        comment,
      });
      //TODO: display snackbar
    }
  };

  return (
    <div className="block md:grid md:grid-cols-[600px_minmax(0,1fr)]">
      <div className="md:sticky md:top-12 md:z-30 md:h-[calc(100vh-49px)]">
        <ScrollArea className="relative h-full flex-1 overflow-hidden px-8">
          <div className="h-full">
            <div className="flex justify-end py-2">
              <CloseAlertDialog
                onSubmit={onCloseSubmit}
                disabled={alert?.status === "CLOSED"}
              />
            </div>

            {alert && (
              <>
                <AlertDetailCard item={alert} />
                <ContactCard />
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="relative flex flex-col bg-secondary">
        {alert && (
          <Chat
          // conversationId={alert.conversation_id}
          // onStartConversation={onStartConversation}
          // alertCategory={alert.category}
          />
        )}
      </div>
    </div>
  );
}
