import {
  type Answer,
  type Attempt,
  type CompletedAttempt,
  type InProgressAttempt,
  type PublicQuestion,
  type PublicQuiz,
  type Question,
  type Quiz,
  type User,
  type CurrentQuestion,
  type QuizAttempt,
  type QuizResult,
  QuizAttemptError,
} from "@/types/quiz";

export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    text: question.text,
    type: question.type,
    options: question.options,
  };
}

export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return { ...quiz, questions: quiz.questions.map(toPublicQuestion) };
}

export function toQuizResult(attempt: CompletedAttempt): QuizResult {
  const result = { ...attempt };
  delete result.quizSnapshot;
  const answered = attempt.answers.filter(
    (answer) => answer.selectedOptionIds.length > 0,
  );
  const correctQuestions = answered.filter((answer) => answer.isCorrect).length;

  return {
    ...result,
    correctQuestions,
    incorrectQuestions: answered.length - correctQuestions,
    unansweredQuestions: attempt.totalQuestions - answered.length,
  };
}

export function toQuizAttempt(attempt: Attempt): QuizAttempt {
  if (attempt.status === "completed") {
    return toQuizResult(attempt);
  }

  const progress = { ...attempt };
  delete progress.quizSnapshot;
  return {
    ...progress,
    answers: attempt.answers.map(
      ({ questionId, selectedOptionIds, answeredAt }) => ({
        questionId,
        selectedOptionIds,
        answeredAt,
      }),
    ),
  };
}

export function getDeadlines(
  quiz: Pick<Quiz, "timeLimitSeconds" | "perQuestionSeconds">,
  attempt: Pick<InProgressAttempt, "startedAt" | "questionStartedAt"> & {
    answers: Pick<Answer, "answeredAt">[];
  },
) {
  const questionStartedAt =
    attempt.questionStartedAt ??
    attempt.answers.at(-1)?.answeredAt ??
    attempt.startedAt;

  return {
    overall:
      quiz.timeLimitSeconds === null
        ? null
        : Date.parse(attempt.startedAt) + quiz.timeLimitSeconds * 1000,
    question:
      quiz.perQuestionSeconds === null
        ? null
        : Date.parse(questionStartedAt) + quiz.perQuestionSeconds * 1000,
  };
}

export function toCurrentQuestion(
  quiz: Quiz,
  attempt: Attempt,
  now: number,
): CurrentQuestion {
  const current =
    attempt.status === "in_progress"
      ? quiz.questions[attempt.currentQuestionIndex]
      : undefined;
  const deadlines = getDeadlines(quiz, attempt);
  const overallRemainingSeconds =
    deadlines.overall === null
      ? null
      : Math.max(0, Math.ceil((deadlines.overall - now) / 1000));
  const questionRemainingSeconds =
    deadlines.question === null
      ? null
      : Math.max(0, Math.ceil((deadlines.question - now) / 1000));
  const remaining = Math.min(
    overallRemainingSeconds ?? Infinity,
    questionRemainingSeconds ?? Infinity,
  );

  return {
    attemptId: attempt.id,
    status: attempt.status,
    question: current ? toPublicQuestion(current) : null,
    index: attempt.currentQuestionIndex,
    total: attempt.totalQuestions,
    remainingSeconds: current ? (remaining === Infinity ? null : remaining) : 0,
    overallRemainingSeconds,
    questionRemainingSeconds,
    selectedOptionIds: current ? (attempt.draftOptionIds ?? []) : [],
  };
}

export function validateQuizAccess(
  quiz: Quiz | undefined,
  user: User | undefined,
): Quiz {
  if (!quiz) {
    throw new QuizAttemptError(
      "This quiz was deleted. Your saved attempt cannot continue.",
    );
  }
  if (!user || !quiz.countries.includes(user.country)) {
    throw new QuizAttemptError(
      "This quiz is not available for the selected user.",
    );
  }
  return quiz;
}

export function createQuizAttempt(
  quiz: Quiz,
  userId: User["id"],
  now: number,
): InProgressAttempt {
  if (quiz.questions.length === 0) {
    throw new QuizAttemptError("This quiz has no questions yet.");
  }
  const timestamp = new Date(now).toISOString();
  return {
    id: crypto.randomUUID(),
    quizId: quiz.id,
    userId,
    startedAt: timestamp,
    questionStartedAt: timestamp,
    currentQuestionIndex: 0,
    answers: [],
    totalQuestions: quiz.questions.length,
    quizSnapshot: JSON.stringify(quiz),
    draftOptionIds: [],
    status: "in_progress",
    completedAt: null,
    score: null,
    percentage: null,
    timeTakenSeconds: null,
  };
}

export function finishQuizAttempt(
  attempt: Attempt,
  now: number,
): CompletedAttempt {
  if (attempt.status === "completed") {
    return attempt;
  }
  const score = attempt.answers.filter((answer) => answer.isCorrect).length;
  return {
    ...attempt,
    status: "completed",
    currentQuestionIndex: attempt.totalQuestions,
    draftOptionIds: [],
    completedAt: new Date(now).toISOString(),
    score,
    percentage: attempt.totalQuestions
      ? Math.round((score / attempt.totalQuestions) * 100)
      : 0,
    timeTakenSeconds: Math.max(
      0,
      Math.ceil((now - Date.parse(attempt.startedAt)) / 1000),
    ),
  };
}

export function validateOptionIds(
  question: Question,
  optionIds: string[],
): string[] {
  const selected = [...new Set(optionIds)];
  if (
    selected.some(
      (id) => !question.options.some((option) => option.id === id),
    ) ||
    (question.type === "single" && selected.length > 1)
  ) {
    throw new QuizAttemptError("Choose a valid answer for this question.");
  }
  return selected;
}

export function recordAnswer(
  quiz: Quiz,
  attempt: InProgressAttempt,
  optionIds: string[],
  now: number,
): Attempt {
  const question = quiz.questions[attempt.currentQuestionIndex];
  if (!question) {
    throw new QuizAttemptError(
      "This answer is not valid for the current question.",
    );
  }
  const selectedOptionIds = validateOptionIds(question, optionIds);
  const timestamp = new Date(now).toISOString();
  const next: InProgressAttempt = {
    ...attempt,
    currentQuestionIndex: attempt.currentQuestionIndex + 1,
    questionStartedAt: timestamp,
    draftOptionIds: [],
    answers: [
      ...attempt.answers,
      {
        questionId: question.id,
        selectedOptionIds,
        isCorrect:
          selectedOptionIds.length === question.correctOptionIds.length &&
          selectedOptionIds.every((id) =>
            question.correctOptionIds.includes(id),
          ),
        answeredAt: timestamp,
      },
    ],
  };
  return next.currentQuestionIndex >= quiz.questions.length
    ? finishQuizAttempt(next, now)
    : next;
}

export function reconcileQuizAttempt(
  quiz: Quiz,
  saved: Attempt,
  now: number,
): Attempt {
  if (saved.status === "completed") {
    return saved;
  }
  const quizSnapshot = JSON.stringify(quiz);
  const changed =
    saved.quizSnapshot !== undefined
      ? saved.quizSnapshot !== quizSnapshot
      : saved.totalQuestions !== quiz.questions.length ||
        saved.answers.some(
          (answer, index) => answer.questionId !== quiz.questions[index]?.id,
        );
  if (changed) {
    throw new QuizAttemptError(
      "This quiz was edited while your attempt was in progress. Your saved answers have been kept, but this attempt cannot continue.",
    );
  }

  let attempt: Attempt = { ...saved, quizSnapshot };
  while (attempt.status === "in_progress") {
    if (attempt.currentQuestionIndex >= quiz.questions.length) {
      return finishQuizAttempt(attempt, now);
    }
    const { overall, question } = getDeadlines(quiz, attempt);
    const deadline = Math.min(overall ?? Infinity, question ?? Infinity);
    if (now < deadline) {
      return attempt;
    }
    attempt = recordAnswer(
      quiz,
      attempt,
      attempt.draftOptionIds ?? [],
      deadline,
    );
    if (overall !== null && overall <= deadline) {
      while (attempt.status === "in_progress") {
        attempt = recordAnswer(quiz, attempt, [], deadline);
      }
    }
  }
  return attempt;
}
