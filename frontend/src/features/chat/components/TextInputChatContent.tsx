import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ButtonSend from "./ButtonSend";
import Textarea from "./TextArea";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

type Props = {
  disabledSend?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isLoading: boolean;
  onSend: (content: string) => void;
};

export const TextInputChatContent: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const [content, setContent] = useState("");

  const disabledSend = useMemo(() => {
    return content === "" || props.disabledSend;
  }, [content, props.disabledSend]);

  const inputRef = useRef<HTMLDivElement>(null);
  const sendContent = useCallback(() => {
    props.onSend(content);
    setContent("");
  }, [content, props]);

  useEffect(() => {
    const currentElem = inputRef?.current;
    const keypressListener = (e: DocumentEventMap["keypress"]) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (!disabledSend) {
          sendContent();
        }
      }
    };
    currentElem?.addEventListener("keypress", keypressListener);

    const pasteListener = (e: DocumentEventMap["paste"]) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems || clipboardItems.length === 0) {
        return;
      }
    };
    currentElem?.addEventListener("paste", pasteListener);

    return () => {
      currentElem?.removeEventListener("keypress", keypressListener);
      currentElem?.removeEventListener("paste", pasteListener);
    };
  });

  return (
    <>
      <div className="sticky bottom-0 z-0 flex w-full justify-center backdrop-blur supports-[backdrop-filter]:bg-secondary/60">
        <div
          ref={inputRef}
          className="text-input-foreground relative mb-7 flex w-11/12 items-center rounded-xl bg-background shadow-md md:w-10/12 lg:w-4/6"
        >
          <Textarea
            className={twMerge(
              "scrollbar-thin scrollbar-thumb-light-gray m-1 flex-grow bg-transparent"
            )}
            placeholder={props.placeholder ?? t("app.inputMessage")}
            disabled={props.disabled}
            noBorder
            value={content}
            onChange={setContent}
          />
          <ButtonSend
            className="ml-2 m-2 align-bottom"
            disabled={disabledSend || props.disabled}
            loading={props.isLoading}
            onClick={sendContent}
          />
        </div>
      </div>
    </>
  );
};

export default TextInputChatContent;
