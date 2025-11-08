import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  difficulty: string;
}

interface DailyContestProps {
  currentUser?: {
    id: string;
    name: string;
    token: string;
  };
}

export const DailyContest = (props: DailyContestProps) => {
  const currentUser =
    props.currentUser || JSON.parse(localStorage.getItem("user") || "{}");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [highestScorer, setHighestScorer] = useState<string>("");

  // Fetch 7 random questions
  const fetchQuestions = async () => {
    if (!currentUser?.token) {
      console.error("User not logged in or token missing");
      return;
    }

    try {
      const res = await axios.get(
        "https://gamified2-o.onrender.com/api/quiz/random-questions",
        {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        }
      );
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error("Error fetching contest questions:", err);
    }
  };

  useEffect(() => {
    if (started) fetchQuestions();
  }, [started]);

  const handleStart = () => {
    setStarted(true);
    setCompleted(false);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setEarnedPoints(0);
  };

  const handleOptionSelect = async (option: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const isCorrect = option === currentQuestion.answer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setEarnedPoints((prev) => prev + 10); // assign points per correct answer

      // sound effect
      const audio = new Audio("/sounds/correct.mp3");
      audio.play();

      // mark question as solved in backend
      try {
        await axios.post(
          "https://gamified2-o.onrender.com/api/question/mark-solved",
          { questionId: currentQuestion.id },
          { headers: { Authorization: `Bearer ${currentUser.token}` } }
        );
      } catch (err) {
        console.error("Error marking question solved:", err);
      }
    } else {
      setIncorrectCount((prev) => prev + 1);
      const audio = new Audio("/sounds/wrong.mp3");
      audio.play();
    }

    if (currentIndex + 1 >= questions.length) {
      setCompleted(true);
      setStarted(false);

      // optional: update highest scorer locally
      if (!highestScorer || earnedPoints + (isCorrect ? 10 : 0) > earnedPoints) {
        setHighestScorer(currentUser.name);
      }

      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (currentIndex + 1 >= questions.length) {
      setCompleted(true);
      setStarted(false);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleExit = () => {
    setStarted(false);
    setCompleted(true);
  };

  if (!started && !completed) {
    return (
      <div className="max-w-3xl mx-auto mt-10 text-center space-y-4">
        <Card className="p-8 shadow-lg">
          <CardHeader>
            <CardTitle>🌟 Daily Eco Contest</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Test your knowledge and earn EcoPoints!</p>
            <Button className="mt-4" onClick={handleStart}>
              Start Contest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-3xl mx-auto mt-10 space-y-4 text-center">
        <Card className="p-8 shadow-lg">
          <CardHeader>
            <CardTitle>🏁 Contest Completed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Correct Answers: {correctCount}</p>
            <p>Incorrect Answers: {incorrectCount}</p>
            <p>EcoPoints Earned: {earnedPoints}</p>
            <p>Highest Scorer: {highestScorer || currentUser.name}</p>
            <Button className="mt-4" onClick={handleStart}>
              Restart Contest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return <p className="text-center mt-10">Loading questions...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-4">
      <Card className="p-6 shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>
            Question {currentIndex + 1} / {questions.length}
          </CardTitle>
          <Badge variant="secondary">EcoPoints: {earnedPoints}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">{currentQuestion.question}</p>
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((opt, idx) => (
              <Button
                key={idx}
                onClick={() => handleOptionSelect(opt)}
                className="text-left"
              >
                {opt}
              </Button>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button variant="destructive" onClick={handleExit}>
              Exit
            </Button>
          </div>
          <Progress
            value={((currentIndex + 1) / questions.length) * 100}
            className="mt-4"
          />
        </CardContent>
      </Card>
    </div>
  );
};
