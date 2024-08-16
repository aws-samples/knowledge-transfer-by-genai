import { PostMessageRequest } from "@/types/chat";
import { useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
export function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamMessage = async (
    postMessageRequest: PostMessageRequest,
    onMessage: (response: string) => void,
    onComplete: () => void
  ) => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    let accumulatedMessage = "";

    try {
      await fetchEventSource(
        `${import.meta.env.VITE_APP_ALERT_API_ENDPOINT}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postMessageRequest),
          signal: controller.signal,
          async onopen(response) {
            if (!response.ok) {
              throw new Error("Failed to initiate chat");
            }
            // Connection is open, proceed as normal
          },
          onmessage(event) {
            // TODO: remove this log
            console.log("Received message", event.data);
            accumulatedMessage += event.data;
            onMessage(accumulatedMessage);
          },
          onclose() {
            // Connection closed
            setIsLoading(false);
            onComplete();
          },
          onerror(err) {
            setError(new Error(`Error occurred: ${err.message}`));
            setIsLoading(false);
            controller.abort();
          },
        }
      );
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      setIsLoading(false);
    }
  };

  return { streamMessage, isLoading, error };
}
