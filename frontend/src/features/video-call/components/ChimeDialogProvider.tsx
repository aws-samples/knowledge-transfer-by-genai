import { ThemeProvider } from "styled-components";
import {
  MeetingProvider,
  BackgroundBlurProvider,
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
  // Thin wrapper component to provide Chime functionality to children
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <BackgroundBlurProvider>
        <MeetingProvider>
          <ChimeCalleeDialog myName={props?.myName ?? ""} />
          {children}
        </MeetingProvider>
      </BackgroundBlurProvider>
    </ThemeProvider>
  );
}

export default ChimeDialogProvider;
