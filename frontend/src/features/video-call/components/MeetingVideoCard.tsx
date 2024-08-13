import { Card } from "@/components/ui/card";
import useMeeting from "@/features/video-call/hooks/useMeeting";
import MeetingVideoDialog from "@/features/video-call/components/MeetingVideoDialog";

type Props = {
  alertId: string;
};

function MeetingVideoCard(props: Props) {
  const { alertId } = props;
  const { meetings } = useMeeting(alertId);

  return (
    <>
      <Card className="my-4 px-12 py-6">
        <label className="font-semibold">ビデオ通話の記録</label>
        <div className="mt-2 flex space-x-1">
          {meetings?.map((meeting) => (
            <MeetingVideoDialog key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </Card>
    </>
  );
}
export default MeetingVideoCard;
