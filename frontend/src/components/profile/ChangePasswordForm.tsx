/**
 * Change Password Form Component
 * Security-focused design with real-time password strength validation
 * Features: Live validation, strength meter, visual feedback, error handling
 */

import { AlertCircle, Check, Eye, EyeOff, Lock, Shield, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  description: string;
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password requirements validation
  const requirements: PasswordRequirement[] = [
    {
      label: "At least 8 characters",
      test: (pwd) => pwd.length >= 8,
      met: newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      test: (pwd) => /[A-Z]/.test(pwd),
      met: /[A-Z]/.test(newPassword),
    },
    {
      label: "One number",
      test: (pwd) => /\d/.test(pwd),
      met: /\d/.test(newPassword),
    },
    {
      label: "One special character",
      test: (pwd) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pwd),
      met: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(newPassword),
    },
  ];

  // Calculate password strength
  const calculateStrength = (password: string): PasswordStrength => {
    if (!password) {
      return {
        score: 0,
        label: "No Password",
        color: "bg-slate-300 dark:bg-slate-700",
        description: "Enter a password to see strength",
      };
    }

    const metRequirements = requirements.filter((req) =>
      req.test(password),
    ).length;

    if (metRequirements === 4 && password.length >= 12) {
      return {
        score: 4,
        label: "Very Strong",
        color: "bg-emerald-500",
        description: "Excellent! Your password is very secure",
      };
    }
    if (metRequirements === 4) {
      return {
        score: 3,
        label: "Strong",
        color: "bg-green-500",
        description: "Good! Your password meets all requirements",
      };
    }
    if (metRequirements >= 3) {
      return {
        score: 2,
        label: "Medium",
        color: "bg-amber-500",
        description: "Acceptable, but could be stronger",
      };
    }
    if (metRequirements >= 2) {
      return {
        score: 1,
        label: "Weak",
        color: "bg-orange-500",
        description: "Your password needs improvement",
      };
    }
    return {
      score: 0,
      label: "Very Weak",
      color: "bg-red-500",
      description: "Too weak - add more variety",
    };
  };

  const strength = calculateStrength(newPassword);
  const allRequirementsMet = requirements.every((req) => req.met);
  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ current: true, new: true, confirm: true });

    // Validation
    if (!currentPassword) {
      toast.error("Current Password Required", {
        description: "Please enter your current password",
      });
      return;
    }

    if (!allRequirementsMet) {
      toast.error("Password Requirements Not Met", {
        description: "Please ensure your new password meets all requirements",
      });
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords Don't Match", {
        description: "New password and confirmation must match",
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Same Password", {
        description: "New password must be different from current password",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/users/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("Password Changed Successfully", {
        description:
          "Your password has been updated. You'll need to log in again.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched({ current: false, new: false, confirm: false });

      // Redirect to login after 2 seconds (backend revokes all sessions)
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || "Failed to change password";

      toast.error("Password Change Failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground font-['Space_Grotesk']">
            Change Password
          </h3>
          <p className="text-sm text-muted-foreground font-['Inter']">
            Update your password to keep your account secure
          </p>
        </div>
      </div>

      {/* Current Password */}
      <div className="space-y-2">
        <Label className="font-['Inter'] font-medium text-foreground">
          Current Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, current: true })}
            className="pl-10 pr-10 font-['Inter'] bg-card border-border text-foreground placeholder:text-muted-foreground"
            placeholder="Enter current password"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCurrentPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label className="font-['Inter'] font-medium text-foreground">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, new: true })}
            className="pl-10 pr-10 font-['Inter'] bg-card border-border text-foreground placeholder:text-muted-foreground"
            placeholder="Enter new password"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNewPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Password Strength Meter */}
        {newPassword && (
          <div className="space-y-3 mt-4 p-4 bg-muted/30 rounded-lg border border-border animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Strength Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-['Inter'] font-medium text-muted-foreground">
                  Password Strength
                </span>
                <span
                  className={`text-xs font-['Fira_Code'] font-bold ${
                    strength.score >= 3
                      ? "text-emerald-600"
                      : strength.score === 2
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {strength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {["weak", "medium", "good", "strong"].map((level, i) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      i < strength.score ? strength.color : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-['Inter']">
                {strength.description}
              </p>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-2 pt-3 border-t border-border">
              <span className="text-xs font-['Inter'] font-medium text-muted-foreground">
                Requirements
              </span>
              {requirements.map((req, index) => (
                <div
                  key={`requirement-${req.label}`}
                  className="flex items-center gap-2 group animate-in fade-in slide-in-from-left duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                      req.met
                        ? "bg-emerald-500 scale-100"
                        : "bg-border scale-90"
                    }`}
                  >
                    {req.met ? (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    ) : (
                      <X
                        className="w-2.5 h-2.5 text-slate-500"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-['Inter'] transition-colors ${
                      req.met
                        ? "text-emerald-600 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label className="font-['Inter'] font-medium text-foreground">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, confirm: true })}
            className="pl-10 pr-10 font-['Inter'] bg-card border-border text-foreground placeholder:text-muted-foreground"
            placeholder="Confirm new password"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Password Match Indicator */}
        {touched.confirm && confirmPassword && (
          <div
            className={`flex items-center gap-2 text-xs font-['Inter'] animate-in fade-in slide-in-from-top-2 duration-300 ${
              passwordsMatch ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {passwordsMatch ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                <span>Passwords match</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Passwords don't match</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 font-['Inter']">
            Security Notice
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 font-['Inter']">
            Changing your password will log you out from all devices. You'll
            need to log in again with your new password.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={
          isSubmitting ||
          !allRequirementsMet ||
          !passwordsMatch ||
          !currentPassword
        }
        className="w-full gap-2 font-['Inter'] font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Update Password
          </>
        )}
      </Button>
    </form>
  );
}
