import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ButtonSend from "./ButtonSend";
import Textarea from "./TextArea";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

type Props = {
  disabledSend?: boolean;
  disabledRegenerate?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isLoading: boolean;
  onSend: (content: string, base64EncodedImages?: string[]) => void;
};

export const TextInputChatContent = forwardRef<HTMLElement, Props>(
  (props, focusInputRef) => {
    const { t } = useTranslation();

    const [content, setContent] = useState("");

    const disabledSend = useMemo(() => {
      return content === "" || props.disabledSend;
    }, [content, props.disabledSend]);

    const inputRef = useRef<HTMLDivElement>(null);

    const sendContent = useCallback(() => {
      props.onSend(content, undefined);
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
        <div
          ref={inputRef}
          className={twMerge(
            "relative mb-7 flex w-11/12 flex-col rounded-xl border border-black/10 bg-white shadow-[0_0_30px_7px] shadow-light-gray md:w-10/12 lg:w-4/6 xl:w-3/6"
          )}
        >
          <div className="flex w-full">
            <Textarea
              placeholder={props.placeholder ?? t("app.inputMessage")}
              disabled={props.disabled}
              noBorder
              value={content}
              onChange={setContent}
              ref={focusInputRef}
            />
          </div>
          <div className="absolute bottom-0 right-0 flex items-center">
            <ButtonSend
              disabled={disabledSend || props.disabled}
              loading={props.isLoading}
              onClick={sendContent}
            />
          </div>
        </div>
      </>
    );
  }
);
