import { PostMessageRequest } from "@/types/chat";
import { useState } from "react";

export function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamMessage = (
    postMessageRequest: PostMessageRequest,
    onMessage: (response: string) => void
  ) => {
    setIsLoading(true);
    setError(null);

    const eventSource = new EventSource(
      import.meta.env.VITE_APP_ALERT_API_ENDPOINT + "/chat"
    );

    eventSource.onmessage = (event) => {
      onMessage(event.data);
    };

    eventSource.onerror = (err) => {
      setError(new Error(`Failed to connect to the stream: ${err}`));
      eventSource.close();
      setIsLoading(false);
    };

    eventSource.onopen = () => {
      fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postMessageRequest),
      }).catch((err) => {
        setError(err);
        eventSource.close();
        setIsLoading(false);
      });
    };

    return () => {
      eventSource.close();
    };
  };

  return { streamMessage, isLoading, error };
}
