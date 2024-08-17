import React from "react";
import { PiPaperPlaneRightFill, PiSpinnerGap } from "react-icons/pi";
import { BaseProps } from "@/features/chat/types/common";
import { Button } from "@/components/ui/button";

import { twMerge } from "tailwind-merge";

type Props = BaseProps & {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

const ButtonSend: React.FC<Props> = (props) => {
  return (
    <Button
      variant="default"
      size="icon"
      className={twMerge("rounded-xl border-primary text-xl", props.className)}
      onClick={props.onClick}
      disabled={props.disabled || props.loading}
    >
      {props.loading ? (
        <PiSpinnerGap className="animate-spin" />
      ) : (
        <PiPaperPlaneRightFill />
      )}
    </Button>
  );
};

export default ButtonSend;
