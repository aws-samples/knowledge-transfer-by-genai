import React from "react";
import { PiPaperPlaneRightFill, PiSpinnerGap } from "react-icons/pi";

import { twMerge } from "tailwind-merge";

type Props = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

const ButtonSend: React.FC<Props> = (props) => {
  return (
    <button
      className={twMerge(
        "m-2 align-bottom flex items-center justify-center rounded-xl bg-aws-sea-blue  p-2 text-xl  text-white hover:bg-aws-sea-blue-hover",
        props.disabled ? "opacity-30" : ""
      )}
      onClick={props.onClick}
      disabled={props.disabled || props.loading}
    >
      {props.loading ? (
        <PiSpinnerGap className="animate-spin" />
      ) : (
        <PiPaperPlaneRightFill />
      )}
    </button>
  );
};

export default ButtonSend;
