import { useCallback, useState } from "react";
import { Device, isVideoTransformDevice } from "amazon-chime-sdk-js";
import {
  useMeetingManager,
  useVideoInputs,
  useBackgroundBlur,
} from "amazon-chime-sdk-component-library-react";

export function useBackgroundBlurToggle() {
  const [isBlurred, setIsBlurred] = useState(false);
  const meetingManager = useMeetingManager();
  const { selectedDevice } = useVideoInputs();
  const { isBackgroundBlurSupported, createBackgroundBlurDevice } =
    useBackgroundBlur();

  const toggleBlur = useCallback(async () => {
    console.log("toggleBlur called. Current isBlurred:", isBlurred);
    if (!selectedDevice) {
      console.log("No selected device");
      return;
    }

    try {
      setIsBlurred((prevBlurred) => {
        const newBlurred = !prevBlurred;
        console.log("Setting isBlurred to:", newBlurred);

        (async () => {
          let current = selectedDevice;
          if (newBlurred && isBackgroundBlurSupported) {
            console.log("Applying blur");
            current = await createBackgroundBlurDevice(current as Device);
          } else if (isVideoTransformDevice(current)) {
            console.log("Removing blur");
            current = await current.intrinsicDevice();
          }
          await meetingManager.startVideoInputDevice(current as Device);
          console.log("Video input device updated");
        })();

        return newBlurred;
      });
    } catch (error) {
      console.error("Failed to toggle Background Blur:", error);
    }
  }, [
    selectedDevice,
    isBackgroundBlurSupported,
    createBackgroundBlurDevice,
    meetingManager,
  ]);

  return { isBlurred, toggleBlur };
}
