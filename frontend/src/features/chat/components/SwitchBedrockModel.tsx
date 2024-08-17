import { twMerge } from "tailwind-merge";
import useModel from "../hooks/useModel";
import { Button } from "@/components/ui/button";

const SwitchBedrockModel: React.FC = () => {
  const { availableModels, modelId, setModelId } = useModel();

  return (
    <div
      className={twMerge(
        "mt-3 w-min",
        "flex justify-center gap-2 rounded-lg border border-light-gray bg-light-gray p-1 text-sm"
      )}
    >
      {availableModels.map((availableModel) => (
        <Button
          key={availableModel.modelId}
          className={twMerge(
            "flex w-40 flex-1 items-center rounded-lg p-2",
            modelId === availableModel.modelId
              ? ""
              : "border-light-gray bg-white text-dark-gray"
          )}
          onClick={() => setModelId(availableModel.modelId)}
          children={<span>{availableModel.label}</span>}
        />
      ))}
    </div>
  );
};

export default SwitchBedrockModel;
