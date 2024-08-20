import React, { ReactNode, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { UsedChunkWithLink } from "@/types/chat";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import { produce } from "immer";
import rehypeExternalLinks, { Options } from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import useMeeting from "@/features/video-call/hooks/useMeeting";
import useRelatedDocument from "@/features/chat/hooks/useRelatedDocument";
import MeetingVideoDialog from "@/features/video-call/components/MeetingVideoDialog";

type Props = {
  alertId: string;
  children: string;
  relatedDocuments?: UsedChunkWithLink[];
  messageIdx: number;
};

const useMarkdownState = create<{
  isOpenReference: {
    [key: string]: boolean;
  };
  setIsOpenReference: (key: string, b: boolean) => void;
}>((set, get) => ({
  isOpenReference: {},
  setIsOpenReference: (key, b) => {
    set({
      isOpenReference: produce(get().isOpenReference, (draft) => {
        draft[key] = b;
      }),
    });
  },
}));

const RelatedDocumentLink: React.FC<{
  relatedDocument?: UsedChunkWithLink;
  linkId: string;
  children: ReactNode;
  alertId: string;
}> = (props) => {
  const { t } = useTranslation();
  const { isOpenReference, setIsOpenReference } = useMarkdownState();
  const { getMeeting } = useMeeting(props.alertId);
  const { extractBucketAndKey } = useRelatedDocument();

  const url = props.relatedDocument?.source;

  let meeting;
  if (url) {
    const { meeting: data } = getMeeting(
      extractBucketAndKey(url).mediaPipelineId
    );
    meeting = data;
  }

  const linkUrl = useMemo(() => {
    const url = props.relatedDocument?.source;
    if (url) {
      if (props.relatedDocument?.contentType === "s3") {
        return decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
      } else {
        return url;
      }
    }
    return "";
  }, [props.relatedDocument?.contentType, props.relatedDocument?.source]);

  return (
    <>
      <span
        className={twMerge(
          "mx-0.5 ",
          props.relatedDocument
            ? "cursor-pointer text-destructive"
            : "text-gray cursor-not-allowed"
        )}
        onClick={() => {
          setIsOpenReference(props.linkId, !isOpenReference[props.linkId]);
        }}
      >
        {props.children}
      </span>

      {props.relatedDocument && (
        <span
          className={twMerge(
            isOpenReference[props.linkId] ? "visible" : "invisible",
            "fixed left-0 top-0 z-50 flex h-dvh w-dvw items-center justify-center bg-primary/20 transition duration-1000"
          )}
          onClick={() => {
            setIsOpenReference(props.linkId, false);
          }}
        >
          <span
            className="max-h-[80vh] w-[70vw] max-w-[800px] overflow-y-auto rounded border bg-primary p-1 text-sm text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {props.relatedDocument.content.split("\n").map((s, idx) => (
              <div key={idx}>{s}</div>
            ))}

            <div className="my-1 border-t pt-1 italic">
              {t("alertDetail.chat.referenceLink")}:
              <span
                className="ml-1 cursor-pointer underline"
                onClick={() => {
                  window.open(props.relatedDocument?.link, "_blank");
                }}
              >
                {linkUrl}
              </span>
              <div className="my-1">
                {t("alertDetail.chat.referenceVideo")}:
              </div>
              {meeting && (
                <MeetingVideoDialog
                  meeting={meeting}
                  alertId={props.alertId}
                  inverted
                />
              )}
            </div>
          </span>
        </span>
      )}
    </>
  );
};

const ChatMessageMarkdown: React.FC<Props> = ({
  alertId,
  children,
  relatedDocuments,
  messageIdx,
}) => {
  const text = useMemo(() => {
    const results = children.match(/\[\^(?<number>[\d])+?\]/g);
    // Default Footnote link is not shown, so set dummy
    return results
      ? `${children}\n${results.map((result) => `${result}: dummy`).join("\n")}`
      : children;
  }, [children]);

  const remarkPlugins = useMemo(() => {
    return [remarkGfm, remarkBreaks, remarkMath];
  }, []);
  const rehypePlugins = useMemo(() => {
    const rehypeExternalLinksOptions: Options = {
      target: "_blank",
      properties: { style: "word-break: break-all;" },
    };
    return [rehypeKatex, [rehypeExternalLinks, rehypeExternalLinksOptions]];
  }, []);

  return (
    <ReactMarkdown
      className="prose max-w-full break-all leading-relaxed"
      children={text}
      remarkPlugins={remarkPlugins}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      rehypePlugins={rehypePlugins}
      components={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        code({ node, inline, className, children, ...props }) {
          return (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sup({ className, children }) {
          const childArray = Array.isArray(children) ? children : [children];
          // Footnote's Link is replaced with a component that displays the Reference document
          return (
            <sup className={className}>
              {childArray.map((child, idx) => {
                if (child?.props["data-footnote-ref"]) {
                  const href: string = child.props.href ?? "";
                  if (/#user-content-fn-[\d]+/.test(href)) {
                    const docNo = Number.parseInt(
                      href.replace("#user-content-fn-", "")
                    );
                    const doc = relatedDocuments?.find(
                      (doc) => doc.rank === docNo
                    );

                    const refNo = child.props.children[0];
                    return (
                      <RelatedDocumentLink
                        key={`${messageIdx}-${idx}-${docNo}`}
                        alertId={alertId}
                        linkId={`${messageIdx}-${idx}-${docNo}`}
                        relatedDocument={doc}
                      >
                        [{refNo}]
                      </RelatedDocumentLink>
                    );
                  }
                }
                return child;
              })}
            </sup>
          );
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        section({ className, children, ...props }) {
          // Normal Footnote not shown for RAG reference documents
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (props["data-footnotes"]) {
            return null;
          } else {
            return <section className={className}>{children}</section>;
          }
        },
      }}
    />
  );
};

export default ChatMessageMarkdown;
