import { create } from "zustand";
import { Model } from "@/types/chat";
import { useMemo } from "react";

const availableModels: {
  modelId: Model;
  label: string;
  supportMediaType: string[];
}[] = [
  {
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    label: "Claude 3 (Haiku)",
    supportMediaType: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  {
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    label: "Claude 3 (Sonnet)",
    supportMediaType: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  {
    modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    label: "Claude 3.5 (Sonnet)",
    supportMediaType: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  {
    modelId: "anthropic.claude-3-opus-20240229-v1:0",
    label: "Claude 3 (Opus)",
    supportMediaType: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
];

const useModelState = create<{
  modelId: Model;
  setModelId: (m: Model) => void;
}>((set) => ({
  modelId: "anthropic.claude-3-haiku-20240307-v1:0",
  setModelId: (m) => {
    set({
      modelId: m,
    });
  },
}));

const useModel = () => {
  const { modelId, setModelId } = useModelState();

  const model = useMemo(() => {
    return availableModels.find((model) => model.modelId === modelId);
  }, [modelId]);

  return {
    modelId,
    setModelId,
    model,
    disabledImageUpload: (model?.supportMediaType.length ?? 0) === 0,
    acceptMediaType:
      model?.supportMediaType.flatMap((mediaType) => {
        const ext = mediaType.split("/")[1];
        return ext === "jpeg" ? [".jpg", ".jpeg"] : [`.${ext}`];
      }) ?? [],
    availableModels,
  };
};

export default useModel;
