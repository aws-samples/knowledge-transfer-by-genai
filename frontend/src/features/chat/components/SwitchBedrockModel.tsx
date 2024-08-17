import { twMerge } from "tailwind-merge";
import useModel from "../hooks/useModel";
import { Button } from "@/components/ui/button";

const SwitchBedrockModel: React.FC = () => {
  const { availableModels, modelId, setModelId } = useModel();

  return (
    <div
      className={twMerge(
        "mt-0 w-min",
        "flex justify-center gap-2 rounded-lg  bg-primary-foreground p-1 text-sm"
      )}
    >
      {availableModels.map((availableModel) => (
        <Button
          key={availableModel.modelId}
          variant={modelId === availableModel.modelId ? "default" : "outline"}
          onClick={() => setModelId(availableModel.modelId)}
          children={<span>{availableModel.label}</span>}
        />
      ))}
    </div>
  );
};

export default SwitchBedrockModel;
