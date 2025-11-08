import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name?: string;
  email?: string;
  ecoPoints: number;
}

interface Friend extends User {
  school?: string;
  avatar?: string;
  level?: number;
  status?: "online" | "offline";
  lastActive?: string;
  badges?: string[];
  currentStreak?: number;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  name?: string;
  school?: string;
  ecoPoints: number;
  avatar?: string;
}

interface Challenge {
  id: string;
  opponent: Friend;
  challengeName: string;
  progress: number;
  completed: boolean;
  winner?: string;
}

interface FriendsSystemProps {
  currentUser: {
    id: string;
    name: string;
    ecoPoints: number;
    token: string;
  };
}

export const FriendsSystem = ({ currentUser }: FriendsSystemProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [challengeHistory, setChallengeHistory] = useState<Challenge[]>([]);

  // Fetch friends + requests + all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, usersRes] = await Promise.all([
          axios.get("https://gamified2-o.onrender.com/api/user/getfriends", {
            headers: { Authorization: `Bearer ${currentUser.token}` },
          }),
          axios.get("https://gamified2-o.onrender.com/api/user/displayUser", {
            headers: { Authorization: `Bearer ${currentUser.token}` },
          }),
        ]);

        setFriends(friendsRes.data.friends || []);
        setFriendRequests(friendsRes.data.friendRequests || []);
        setAllUsers(usersRes.data.users || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [currentUser]);

  // Accept / Decline Friend Request
  const handleRespondRequest = async (requestId: string, action: "accept" | "decline") => {
  try {
    const url =
      action === "accept"
        ? `https://gamified2-o.onrender.com/api/user/accept/${requestId}`
        : `https://gamified2-o.onrender.com/api/user/decline/${requestId}`;

    await axios.put(url, {}, { headers: { Authorization: `Bearer ${currentUser.token}` } });

    // Update UI state
    setFriendRequests(friendRequests.filter((r) => r.id !== requestId));

    if (action === "accept") {
      // Fetch updated friends list
      const res = await axios.get("https://gamified2-o.onrender.com/api/user/getfriends", {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setFriends(res.data.friends || []);
    }
  } catch (err) {
    console.error("Error responding to request:", err);
  }
};


  // Send Friend Request
  const handleSendRequest = async (recipientId: string) => {
    try {
      await axios.post(
        `https://gamified2-o.onrender.com/api/user/request/${recipientId}`,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      alert("✅ Friend request sent!");
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  // Invite Friend to Challenge
  const handleChallengeFriend = (friend: Friend) => {
    const newChallenge: Challenge = {
      id: Date.now().toString(),
      opponent: friend,
      challengeName: "Eco Quiz Challenge",
      progress: 0,
      completed: false,
    };
    setActiveChallenges([...activeChallenges, newChallenge]);
  };

  // Complete Challenge
  const handleCompleteChallenge = (challengeId: string) => {
    setActiveChallenges((prev) =>
      prev.map((ch) =>
        ch.id === challengeId
          ? {
              ...ch,
              progress: 100,
              completed: true,
              winner: Math.random() > 0.5 ? currentUser.name : ch.opponent.name ?? "Opponent",
            }
          : ch
      )
    );

    const finished = activeChallenges.find((c) => c.id === challengeId);
    if (finished) {
      setChallengeHistory([...challengeHistory, { ...finished, completed: true }]);
    }
  };

  // Leaderboard
  const leaderboardFriends = [...friends]
    .sort((a, b) => b.ecoPoints - a.ecoPoints)
    .map((friend, index) => ({ ...friend, rank: index + 1 }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            👥 Friends & Social
          </CardTitle>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search friends by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({friendRequests.length})</TabsTrigger>
          <TabsTrigger value="allUsers">All Users ({allUsers.length})</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="activeChallenges">Active Challenges</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          <AnimatePresence>
            {friends.length === 0 ? (
              <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                No friends yet.
              </motion.p>
            ) : (
              friends.map((friend) => (
                <motion.div key={friend.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{(friend?.name ?? "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{friend?.name ?? "Unknown"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {friend?.school ?? "No school info"}
                          </p>
                          <p className="text-xs text-green-600">
                            {friend.status === "online" ? "🟢 Online" : "⚫ Offline"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Lvl {friend.level || 1}</Badge>
                        <Button size="sm" onClick={() => handleChallengeFriend(friend)}>
                          ⚔️ Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <AnimatePresence>
            {friendRequests.length === 0 ? (
              <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                No pending requests.
              </motion.p>
            ) : (
              friendRequests.map((request) => (
                <motion.div key={request.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{(request?.name ?? "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{request?.name ?? "Unknown"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request?.school ?? "No school info"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRespondRequest(request.id, "decline")}>
                          ❌ Decline
                        </Button>
                        <Button size="sm" onClick={() => handleRespondRequest(request.id, "accept")}>
                          ✅ Accept
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="allUsers" className="space-y-4">
          {allUsers
            .filter((u) =>
              (u?.name ?? "").toLowerCase().includes((searchQuery ?? "").toLowerCase())
            )
            .map((user) => (
              <motion.div key={user.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{user?.name ?? "Unknown"}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email ?? "No email"}</p>
                    </div>
                    <Button size="sm" onClick={() => handleSendRequest(user.id)}>
                      ➕ Add Friend
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friends Leaderboard 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardFriends.map((friend) => (
                <motion.div
                  key={friend.id}
                  className="flex justify-between p-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>
                    {friend.rank}. {friend?.name ?? "Unknown"}
                  </span>
                  <span>{friend.ecoPoints} pts</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Challenges */}
        <TabsContent value="activeChallenges" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <p className="text-muted-foreground">No active challenges.</p>
          ) : (
            activeChallenges.map((ch) => (
              <Card key={ch.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{ch.challengeName}</h3>
                    <p className="text-sm">vs {ch.opponent?.name}</p>
                    <p className="text-xs">Progress: {ch.progress}%</p>
                  </div>
                  <div className="flex gap-2">
                    {!ch.completed ? (
                      <Button size="sm" onClick={() => handleCompleteChallenge(ch.id)}>
                        ✅ Complete
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        Winner: {ch.winner}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          {challengeHistory.length === 0 ? (
            <p className="text-muted-foreground">No past challenges yet.</p>
          ) : (
            challengeHistory.map((ch) => (
              <Card key={ch.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{ch.challengeName}</h3>
                    <p className="text-sm">vs {ch.opponent?.name}</p>
                  </div>
                  <Badge variant="secondary">
                    {ch.winner === currentUser.name ? "🏆 You Won" : "😢 You Lost"}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
