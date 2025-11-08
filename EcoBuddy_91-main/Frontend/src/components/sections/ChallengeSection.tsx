import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Friend { _id: string; name: string; }

interface Question { _id: string; question: string; options: string[]; answer: string; }

interface Challenge {
  _id: string;
  fromUser: { _id: string; name: string };
  toUser: string;
  numQuestions: number;
  status: string;
  createdAt: string;
  winner?: string;
}

interface ChallengesSectionProps {
  currentUser: { _id: string; name: string; token: string };
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({ currentUser }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "global" | "pending" | "play">("friends");

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [questionTimer, setQuestionTimer] = useState(30);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [waitingOpponent, setWaitingOpponent] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${currentUser.token}` } };

  // Fetch friends
  useEffect(() => {
    axios.get("https://gamified2-o.onrender.com/api/user/getfriends", authHeaders)
      .then(res => setFriends(res.data.friends || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch pending invites
  const fetchInvites = async () => {
    try {
      const res = await axios.get("https://gamified2-o.onrender.com/challenge/myinvites", authHeaders);
      setPendingInvites(res.data.invites || []);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchInvites(); }, []);

  // Invite modal
  const handleOpenInviteModal = (friend: Friend) => {
    setSelectedFriend(friend);
    setNumQuestions(5);
    setShowInviteModal(true);
  };

  const handleSendInvite = async () => {
    if (!selectedFriend) return;
    try {
      await axios.post("https://gamified2-o.onrender.com/challenge/invite",
        { friendId: selectedFriend._id, numQuestions }, authHeaders);
      setShowInviteModal(false);
      fetchInvites();
      alert("Challenge invite sent!");
    } catch (err) { console.error(err); }
  };

  // Accept invite -> switch to play tab
  const handleAcceptInvite = async (invite: Challenge) => {
    try {
      await axios.post("https://gamified2-o.onrender.com/challenge/accept", { inviteId: invite._id }, authHeaders);
      setCurrentChallenge(invite);
      setActiveTab("play");
      setHasStarted(false);
    } catch (err) { console.error(err); }
  };

  // Start challenge manually
  const handleStartChallenge = async () => {
    if (!currentChallenge) return;
    try {
      await axios.post("https://gamified2-o.onrender.com/challenge/start",
        { challengeId: currentChallenge._id }, authHeaders);
      setHasStarted(true);

      // Fetch questions
      const res = await axios.get(
        `https://gamified2-o.onrender.com/challenge/getQuestions?numQuestions=${currentChallenge.numQuestions}`,
        authHeaders
      );
      setQuestions(res.data.questions || []);
      setCurrentQuestionIndex(0);
      setQuestionTimer(30);

      const id = setInterval(() => setQuestionTimer(prev => {
        if (prev === 1) handleNextQuestion();
        return prev - 1;
      }), 1000);
      setIntervalId(id);
    } catch (err) { console.error(err); }
  };

  const handleSelectOption = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === questions[currentQuestionIndex].answer;
    if (correct) setScore(prev => prev + 1);
    setAnswers(prev => [...prev, { questionId: questions[currentQuestionIndex]._id, answer: option, correct }]);
    setTimeout(() => handleNextQuestion(), 800);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimer(30);
      setSelectedOption(null);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    clearInterval(intervalId);
    if (!currentChallenge) return;
    try {
      const res = await axios.post("https://gamified2-o.onrender.com/challenge/submit",
        { challengeId: currentChallenge._id, answers, timeTaken: currentChallenge.numQuestions*30 - questionTimer },
        authHeaders
      );
      if (res.data.winner) {
        setWinner(res.data.winner);
        alert(`Challenge finished! Winner: ${res.data.winner}`);
      } else {
        setWaitingOpponent(true);
      }
      fetchInvites();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-4">🎯 Challenge Section</h1>

      <div className="flex gap-4 mb-4">
        <Button onClick={() => setActiveTab("friends")}>Challenge Friend</Button>
        <Button onClick={() => setActiveTab("global")}>Global Challenge</Button>
        <Button onClick={() => setActiveTab("pending")}>Pending Invites ({pendingInvites.length})</Button>
      </div>

      {/* Friends */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map(friend => (
            <Card key={friend._id} className="flex justify-between items-center p-4 shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <Avatar><AvatarFallback>{friend.name?.charAt(0) ?? "U"}</AvatarFallback></Avatar>
                <span className="font-semibold">{friend.name}</span>
              </div>
              <Button onClick={() => handleOpenInviteModal(friend)}>⚔️ Challenge</Button>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Invites */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingInvites.map(invite => (
            <Card key={invite._id} className="p-4 flex justify-between items-center shadow-md hover:bg-gray-50">
              <span>{invite.fromUser.name} invited you ({invite.numQuestions} Qs)</span>
              <Button onClick={() => handleAcceptInvite(invite)}>Accept</Button>
            </Card>
          ))}
        </div>
      )}

      {/* Play Challenge */}
      {activeTab === "play" && currentChallenge && (
        <Card className="p-6 shadow-xl border rounded-lg bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">🎮 Challenge vs {currentChallenge.fromUser.name}</CardTitle>
            {!hasStarted && <Button onClick={handleStartChallenge}>Start Challenge</Button>}
            {waitingOpponent && <p className="text-orange-600 font-semibold mt-2">Waiting for opponent to finish...</p>}
            {hasStarted && <p className="text-sm text-gray-600">Time Remaining: {questionTimer}s</p>}
          </CardHeader>

          {hasStarted && questions.length > 0 && (
            <>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-4" />
              <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <p className="text-lg font-semibold">{questions[currentQuestionIndex].question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {questions[currentQuestionIndex].options.map(opt => (
                    <Button key={opt} onClick={() => handleSelectOption(opt)}
                      className={`transition-colors ${selectedOption ? (opt === questions[currentQuestionIndex].answer ? "bg-green-400 text-white" : opt === selectedOption ? "bg-red-400 text-white" : "") : ""}`}>
                      {opt}
                    </Button>
                  ))}
                </div>
              </motion.div>
              <p className="mt-4 font-semibold">Score: {score}/{questions.length}</p>
            </>
          )}

          {winner && <p className="text-xl font-bold mt-4 text-center text-green-700">🏆 Winner: {winner}</p>}
        </Card>
      )}

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Challenge {selectedFriend?.name}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2">
              Number of Questions:
              <input type="number" min={1} max={20} value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))}
                className="border p-2 rounded w-20"/>
            </label>
            <div className="flex gap-2">
              <Button onClick={handleSendInvite}>Send Invite</Button>
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
