import { ThemeProvider } from "styled-components";
import {
  MeetingProvider,
  lightTheme,
  GlobalStyles,
} from "amazon-chime-sdk-component-library-react";
import ChimeCalleeDialog from "@/features/video-call/components/ChimeCalleeDialog";

type Props = {
  myName: string;
  children?: React.ReactNode;
};

function ChimeDialogProvider(props: Props) {
  const { children } = props;
  // Thin wrapper component to provide the ChimeDialog and ChimeCalleeDialog components
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <MeetingProvider>
        <ChimeCalleeDialog myName={props?.myName ?? ""} />
        {children}
      </MeetingProvider>
    </ThemeProvider>
  );
}

export default ChimeDialogProvider;
