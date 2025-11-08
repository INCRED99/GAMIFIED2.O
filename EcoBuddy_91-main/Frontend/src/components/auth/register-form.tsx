import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RegisterFormProps {
  onRegister: (userType: string, userData: any) => void;
}

export const RegisterForm = ({ onRegister }: RegisterFormProps) => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    schoolCode: "",
    studentId: "",
    teacherId: "",
    adminId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://gamified2-o.onrender.com/api/user/register",
        { ...formData, userType },
        { withCredentials: true }
      );

      // send user data + token to parent
      onRegister(userType, response.data.user);
    } catch (error: any) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  const userTypeInfo = {
    student: {
      title: "Student Registration",
      description: "Sign up to access challenges, quizzes, and leaderboards",
      icon: "🎓",
    },
    teacher: {
      title: "Teacher Registration",
      description: "Sign up to manage classes and create content",
      icon: "👨‍🏫",
    },
    admin: {
      title: "Admin Registration",
      description: "Register to oversee school programs and manage users",
      icon: "🏫",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-nature">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌱</div>
          <CardTitle className="text-2xl bg-gradient-nature bg-clip-text text-transparent">
            EcoLearn
          </CardTitle>
          <p className="text-muted-foreground">Create your account</p>
        </CardHeader>
        <CardContent>
          <Tabs value={userType} onValueChange={setUserType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student" className="text-xs">Student</TabsTrigger>
              <TabsTrigger value="teacher" className="text-xs">Teacher</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
            </TabsList>

            {Object.entries(userTypeInfo).map(([type, info]) => (
              <TabsContent key={type} value={type}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl mb-2">{info.icon}</div>
                    <h3 className="font-semibold">{info.title}</h3>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Choose a password"
                      required
                    />
                  </div>

                  {type === "student" && (
                    <>
                      <div>
                        <Label htmlFor="schoolCode">School Code</Label>
                        <Input
                          id="schoolCode"
                          value={formData.schoolCode}
                          onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                          placeholder="e.g., DPS001"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                          id="studentId"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          placeholder="Your student ID"
                          required
                        />
                      </div>
                    </>
                  )}

                  {type === "teacher" && (
                    <div>
                      <Label htmlFor="teacherId">Teacher ID</Label>
                      <Input
                        id="teacherId"
                        value={formData.teacherId}
                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                        placeholder="Your teacher ID"
                        required
                      />
                    </div>
                  )}

                  {type === "admin" && (
                    <div>
                      <Label htmlFor="adminId">Admin ID</Label>
                      <Input
                        id="adminId"
                        value={formData.adminId}
                        onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                        placeholder="Admin code"
                        required
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full mt-4">
                    Register
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
