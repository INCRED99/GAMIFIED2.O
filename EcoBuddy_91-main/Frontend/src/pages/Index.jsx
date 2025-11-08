import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import  LoginForm  from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Navigation } from "@/components/navigation";
import EcoChatWidget from "@/components/chat/EcoChatWidget";

import { DailyContest } from "@/components/contests/daily-contest";
import { FriendsSystem } from "@/components/social/friends-system";
import { QuizSystem } from "@/components/quiz/quiz-system";
import { InteractiveModule } from "@/components/learning/interactive-module";

import { BadgesSection } from "@/components/sections/BadgeSection";
import { HomeSection } from "@/components/sections/HomeSection";
import { LeaderboardSection } from "@/components/sections/LeaderBoardSection";
import { ProfileSection } from "@/components/sections/Profile";
import { ChallengesSection } from "@/components/sections/ChallengeSection";
import Collection from "@/components/sections/Collection";
import  EcoGames from "@/components/sections/EcoGames"; // ✅ Added EcoGames import

const Index = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ecoStats, setEcoStats] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeSection, setActiveSection] = useState("home");
  const [authMode, setAuthMode] = useState("none");

  // eco tips for mascot
  const ecoTips = [
    "💡 Planting one tree absorbs up to 48 lbs of CO₂ per year!",
    "💡 Turn off unused lights to save energy.",
    "💡 Recycle plastic, paper & glass to reduce waste.",
    "💡 Use public transport or cycle to cut emissions.",
    "💡 Save water – every drop counts!",
  ];
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % ecoTips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // ---------------- Auth Handlers ----------------
  const handleLogin = (userType, userData) => {
    const newUser = { ...userData, userType };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleRegister = (userType, userData) => {
    const newUser = { ...userData, userType };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setActiveSection("home");
    setAuthMode("none");
    localStorage.removeItem("user");
    localStorage.removeItem("activeSection");
  };

  // ---------------- Restore Session ----------------
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedSection = localStorage.getItem("activeSection");
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedSection) setActiveSection(savedSection);
  }, []);

  // ---------------- Handle Profile Image Update ----------------
  const handleProfileImageUpdate = (file) => {
    const formData = new FormData();
    formData.append("picture", file);

    axios
      .post("https://gamified2-o.onrender.com/api/user/profile/picture", formData, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        setProfile((prev) => ({ ...prev, picture: res.data.profilePicture }));
      })
      .catch((err) => console.error("Error updating profile picture", err));
  };

  // Persist section
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("activeSection", activeSection);
    }
  }, [activeSection, user]);

  // ---------------- Fetch User Profile ----------------
  useEffect(() => {
    if (user?.token) {
      axios
        .get("https://gamified2-o.onrender.com/api/user/profile", {
          withCredentials: true,
          headers: { Authorization: `Bearer ${user.token}` },
        })
        .then((res) => {
          setProfile(res.data);
          setEcoStats(res.data.ecoStats || []);
          setChallenges(res.data.challenges || []);
          setBadges(res.data.badges || []);
          setLeaderboard(res.data.leaderboard || []);
        })
        .catch((err) => console.error("Error fetching profile", err));
    }
  }, [user]);

  // ---------------- Landing + Auth UI ----------------
  if (!user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-tr from-green-200 via-white to-blue-200">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-green-500 opacity-40 text-3xl"
              initial={{ y: -50, x: Math.random() * window.innerWidth }}
              animate={{ y: "100vh", rotate: 360 }}
              transition={{
                duration: 12 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
            >
              🍃
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {authMode === "none" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -40 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="z-10 text-center p-10 sm:p-12 bg-white/80 rounded-3xl shadow-2xl backdrop-blur-md max-w-3xl w-full mx-4"
            >
              <motion.h1
                className="text-5xl sm:text-6xl font-extrabold text-green-700 drop-shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                🌱 EcoLearn
              </motion.h1>
              <p className="mt-4 text-gray-700 text-lg sm:text-xl italic">
                Learn • Play • Compete • Save the Planet 🌍
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                {[
                  { title: "Quizzes", icon: "🧠", desc: "Test your eco knowledge" },
                  { title: "Challenges", icon: "🎯", desc: "Complete fun eco tasks" },
                  { title: "Leaderboard", icon: "🏆", desc: "Compete with friends" },
                ].map((f) => (
                  <motion.div
                    key={f.title}
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-lg hover:shadow-2xl cursor-pointer transition-all"
                    whileHover={{ scale: 1.05, rotate: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-4xl">{f.icon}</div>
                    <h3 className="mt-2 text-xl font-bold text-green-800">{f.title}</h3>
                    <p className="text-gray-600 text-sm">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center gap-6 mt-10 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthMode("login")}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg rounded-2xl shadow-lg transition"
                >
                  🚪 Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthMode("register")}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-2xl shadow-lg transition"
                >
                  ✨ Register
                </motion.button>
              </div>
            </motion.div>
          )}

          {authMode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -80 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="z-10 w-full max-w-lg bg-white/90 p-10 rounded-3xl shadow-2xl backdrop-blur-md mx-4"
            >
              <LoginForm onLogin={handleLogin} />
              <p className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => setAuthMode("register")}
                  className="text-blue-500 underline"
                >
                  Register
                </button>
              </p>
              <p
                onClick={() => setAuthMode("none")}
                className="mt-2 text-center text-gray-500 cursor-pointer hover:text-gray-700"
              >
                ⬅ Back
              </p>
            </motion.div>
          )}

          {authMode === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="z-10 w-full max-w-lg bg-white/90 p-10 rounded-3xl shadow-2xl backdrop-blur-md mx-4"
            >
              <RegisterForm onRegister={handleRegister} />
              <p className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => setAuthMode("login")}
                  className="text-blue-500 underline"
                >
                  Login
                </button>
              </p>
              <p
                onClick={() => setAuthMode("none")}
                className="mt-2 text-center text-gray-500 cursor-pointer hover:text-gray-700"
              >
                ⬅ Back
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute bottom-6 left-6 z-20 cursor-pointer"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <div className="text-5xl">🌳</div>
          <motion.div
            key={currentTipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="absolute left-14 bottom-8 bg-white/90 rounded-xl shadow-xl px-4 py-2 text-sm text-gray-700 w-56"
          >
            {ecoTips[currentTipIndex]}
          </motion.div>
        </motion.div>

        <EcoChatWidget />
      </div>
    );
  }

  // ---------------- Section Renderer ----------------
  const renderSection = () => {
    switch (activeSection) {
      case "contests":
        return <DailyContest />;
      case "friends":
        return <FriendsSystem currentUser={user} />;
      case "learn":
        return (
          <InteractiveModule
            module={profile?.learningModule}
            currentUser={user}
            onComplete={(moduleId, sectionId) =>
              console.log("Section completed:", moduleId, sectionId)
            }
          />
        );
      case "quiz":
        return <QuizSystem currentUser={user} />;
      case "games": // ✅ Added Games case
        return <EcoGames />;
      case "challenges":
        return <ChallengesSection currentUser={user} />;
      case "badges":
        return <BadgesSection badges={badges} />;
      case "collection":
        return <Collection currentUser={user} />;
      case "leaderboard":
        return <LeaderboardSection leaderboard={leaderboard} />;
      case "profile":
        return (
          <ProfileSection
            profile={profile}
            ecoStats={ecoStats}
            currentUser={user}
            handleLogout={handleLogout}
            onProfileImageUpdate={handleProfileImageUpdate}
          />
        );
      default:
        return <HomeSection user={user} ecoStats={ecoStats} onJoinContest={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userType={user?.userType}
        onLogout={handleLogout}
      />
      <motion.main
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container mx-auto px-4 py-8"
      >
        {renderSection()}
      </motion.main>

      <EcoChatWidget />
    </div>
  );
};

export default Index;