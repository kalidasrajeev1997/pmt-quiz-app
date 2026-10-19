import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getAdminQuiz } from "@/services/quiz.service";
import { useQuizMutations } from "@/hooks/useQuizMutations";
import QuizEditorSkeleton from "./QuizEditorSkeleton";
import QuizForm from "./QuizForm";

export default function QuizEditor({ quizId }: { quizId?: string }) {
  const navigate = useNavigate();
  const { save } = useQuizMutations();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_QUIZZES, quizId],
    queryFn: () => getAdminQuiz(quizId!),
    enabled: !!quizId,
  });
  const goBack = () => {
    navigate({ to: "/admin" });
  };

  if (quizId && isPending) return <QuizEditorSkeleton />;
  if (quizId && error)
    return (
      <div role="alert" className="space-y-4 p-7">
        <p>{error.message}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={goBack}
            className="h-10 text-white bg-muted"
          >
            Back to quizzes
          </Button>
          <Button onClick={() => refetch()} className="h-10 text-white">
            Try again
          </Button>
        </div>
      </div>
    );

  return (
    <QuizForm
      key={quizId ?? "new"}
      quiz={data}
      onSave={(values) => save.mutateAsync({ id: quizId, data: values })}
      onSaved={goBack}
      onCancel={goBack}
    />
  );
}
