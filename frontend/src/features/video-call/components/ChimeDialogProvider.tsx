import { ThemeProvider } from "styled-components";
import {
  MeetingProvider,
  lightTheme,
  GlobalStyles,
} from "amazon-chime-sdk-component-library-react";
import ChimeDialog from "@/features/video-call/components/ChimeDialog";
import ChimeCallDialog from "@/features/video-call/components/ChimeCallDialog";

type Props = {
  myId: string;
};

function ChimeDialogProvider(props: Props) {
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <MeetingProvider>
        <ChimeDialog myId={props?.myId ?? ""} />
        <ChimeCallDialog myId={props?.myId ?? ""} />
      </MeetingProvider>
    </ThemeProvider>
  );
}

export default ChimeDialogProvider;
