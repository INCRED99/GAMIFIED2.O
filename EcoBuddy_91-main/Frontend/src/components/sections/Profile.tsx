import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { UploadCloud } from "lucide-react";

interface EcoStat {
  category: string;
  value: number;
}

interface ProfileSectionProps {
  profile: any;
  ecoStats: EcoStat[];
  handleLogout: () => void;
  currentUser: any; // to access token
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  ecoStats,
  handleLogout,
  currentUser,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Show current profile picture or default
    setPreviewImage(profile?.picture || null);
  }, [profile]);

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const displayName =
    profile.username || profile.name || profile.email?.split?.("@")?.[0] || "User";

  // -------------------- Profile Image Upload --------------------
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(
        "https://gamified2-o.onrender.com/api/user/profile-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedUrl = res.data.imageUrl;
      setPreviewImage(uploadedUrl); // Update preview with backend URL
      toast.success("Profile image updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to upload profile image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="w-full py-12 px-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto hover:scale-[1.01] transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <Button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
          >
            Logout
          </Button>
        </div>

        {/* Basic Info */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-indigo-200 flex items-center justify-center overflow-hidden relative shadow-md">
            {previewImage ? (
              <img
                src={previewImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-white">
                {displayName?.[0]?.toUpperCase() || "U"}
              </span>
            )}
            {/* File input overlay */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center text-white font-semibold">
                Uploading...
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{displayName}</h3>
            <p className="text-gray-500">{profile.email}</p>
          </div>
        </div>

        {/* Eco Points */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">🌍 Eco Points</h3>
          <div className="bg-green-50 p-6 rounded-xl text-center shadow hover:shadow-lg transition">
            <p className="text-4xl font-bold text-green-600">
              {profile.EcoPoints ?? profile.ecoPoints ?? 0}
            </p>
            <p className="text-sm text-gray-600">Total Eco Points Earned</p>
          </div>
        </div>

        {/* Eco Stats */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Eco Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {ecoStats && ecoStats.length > 0 ? (
              ecoStats.map((stat, idx) => (
                <div key={idx} className="bg-indigo-50 p-4 rounded-xl text-center shadow hover:shadow-md transition">
                  <p className="text-2xl font-bold text-indigo-600">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.category}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-2">No eco stats available yet.</p>
            )}
          </div>
        </div>

        {/* Challenges Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Challenges Completed</h3>
          <p className="text-gray-700">{profile.challenges?.length || 0} challenges completed</p>
        </div>
      </div>
    </section>
  );
};
