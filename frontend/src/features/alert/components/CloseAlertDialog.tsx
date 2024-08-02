import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function CloseAlertDialog({
  onSubmit,
  disabled,
}: {
  onSubmit: (comment: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.currentTarget.value);
  };

  const onClickSubmit = () => {
    onSubmit(value);
    setOpen(false);
    setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          Close Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Close Alert</DialogTitle>
          <DialogDescription>
            このアラートをクローズします。理由と詳細をコメントに必ず記入してください。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="comment" className="text-sm leading-8">
            コメント*
          </label>
          <textarea
            id="comment"
            onChange={onChange}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="クローズする理由とコメントを記入する"
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onClickSubmit} disabled={!value}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CloseAlertDialog;
