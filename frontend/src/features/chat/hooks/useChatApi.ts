import { MutatorCallback, useSWRConfig } from "swr";
import { Conversation } from "@/types/chat";
import useHttp from "@/hooks/useHttp";

const useChatApi = () => {
  const http = useHttp();
  const { mutate } = useSWRConfig();

  return {
    getConversation: (alertId: string) => {
      return http.get<Conversation>(`chat/${alertId}`, {
        keepPreviousData: true,
      });
    },
    getReferenceDocumentUrl: (bucket: string, key: string) => {
      return http.get<string>(`chat/reference/${bucket}/${key}`);
    },
    mutateConversation: (
      alertId: string,
      conversation?:
        | Conversation
        | Promise<Conversation>
        | MutatorCallback<Conversation>,
      options?: Parameters<typeof mutate>[2]
    ) => {
      return mutate(`chat/${alertId}`, conversation, options);
    },
  };
};

export default useChatApi;
