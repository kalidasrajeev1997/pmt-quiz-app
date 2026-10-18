import { cn } from "@/lib/utils";

interface QuizDetailCardProps {
  title: string;
  stat: string;
  icon: React.ElementType;
  color: string;
}

const QuizDetailCard = ({
  title,
  stat,
  icon: Icon,
  color,
}: QuizDetailCardProps) => {
  return (
    <div className="space-y-2 p-4 rounded-md items-center bg-background border-2 border-b-6">
      <dt className="text-sm text-foreground flex justify-between">
        <span>{title}</span>{" "}
        <Icon className={cn("inline-block size-5", color)} />
      </dt>
      <dd className="text-lg font-semibold tabular-nums text-foreground">
        {stat}
      </dd>
    </div>
  );
};

export default QuizDetailCard;
