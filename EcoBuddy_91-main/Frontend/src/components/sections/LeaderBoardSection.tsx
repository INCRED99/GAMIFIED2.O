import React, { useEffect, useState } from "react";
import axios from "axios";

type LeaderboardEntry = {
  _id: string;
  name: string;
  EcoPoints: number;
};

export const LeaderboardSection: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    axios
      .get("https://gamified2-o.onrender.com/api/ecoPoints/leaderboard")
      .then((res) => setLeaderboard(res.data))
      .catch((err) => console.error("Failed to load leaderboard", err));
  }, []);

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🌱";
    }
  };

  return (
    <section className="w-full py-12 px-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">🏆 Leaderboard</h2>

      {leaderboard.length === 0 ? (
        <p className="text-center text-gray-500">
          No scores yet. Play a challenge to join!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  EcoPoints
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr
                  key={user._id}
                  className={`${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-green-50 transition`}
                >
                  <td className="py-3 px-4 text-lg">{getRankEmoji(index)}</td>
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4">{user.EcoPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
