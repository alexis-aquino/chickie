import { useState, useRef, useId, type ChangeEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { initials } from "@/utils/format";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Palette, Camera, Check, Crown, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const THEMES = [
  { id: "default", label: "Chickie Red", bg: "bg-brand", ring: "ring-red-500", accent: "#dc2626" },
  { id: "crimson", label: "Deep Crimson", bg: "bg-rose-700", ring: "ring-rose-600", accent: "#be123c" },
  { id: "ocean", label: "Ocean Blue", bg: "bg-blue-600", ring: "ring-blue-500", accent: "#2563eb" },
  { id: "forest", label: "Forest Green", bg: "bg-emerald-700", ring: "ring-emerald-600", accent: "#047857" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const ACCENT_COLORS = ["#dc2626", "#e11d48", "#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#db2777"];

export function ProfileDialog({ open, onOpenChange }: Props) {
  const { user, updateProfile, logout } = useAuth();
  const uid = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [theme, setTheme] = useState<ThemeId>((user?.theme ?? "default") as ThemeId);
  const [accent, setAccent] = useState(user?.accentColor ?? "#dc2626");

  if (!user) return null;

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large — please use a file under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateProfile({ avatar: null });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    updateProfile({ name: name.trim(), phone, bio });
    toast.success("Profile updated!");
  };

  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (verifyError) {
        toast.error("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed successfully!");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveAppearance = () => {
    updateProfile({ theme, accentColor: accent });
    toast.success("Appearance saved!");
  };

  const userInitials = initials(user.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto gap-0 p-0" aria-describedby="profile-dialog-desc">
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>
        <DialogDescription id="profile-dialog-desc" className="sr-only">
          Update your profile information, change your password, and personalise your dashboard appearance.
        </DialogDescription>
        {/* Header banner */}
        <div className="h-24 bg-gradient-to-r from-brand to-brand-accent rounded-t-xl relative shrink-0">
          <div className="absolute -bottom-10 left-6">
            <div className="relative group">
              <Avatar className="size-20 ring-4 ring-background shadow-lg">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-amber-400 text-red-900 text-2xl font-medium">{userInitials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Change photo"
                aria-label="Change profile photo"
              >
                <Camera className="size-5 text-white" aria-hidden="true" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-4 flex items-start justify-between">
          <div>
            <div className="font-medium text-lg flex items-center gap-1.5">
              {user.name}
              {user.role === "owner" && <Crown className="size-4 text-amber-500" aria-label="Owner" />}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
          <Badge variant="outline" className="capitalize mt-1">
            {user.role}
          </Badge>
        </div>

        <Separator />

        <Tabs defaultValue="profile" className="p-6 pt-4 gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1 gap-1.5">
              <User className="size-3.5" aria-hidden="true" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 gap-1.5">
              <Lock className="size-3.5" aria-hidden="true" /> Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 gap-1.5">
              <Palette className="size-3.5" aria-hidden="true" /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile" className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-4 rounded-xl border p-4 bg-muted/20">
              <Avatar className="size-14 shrink-0">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-amber-400 text-red-900 text-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Profile Photo</span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                    <Camera className="size-3.5" aria-hidden="true" />
                    {user.avatar ? "Change" : "Upload"} Photo
                  </Button>
                  {user.avatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF · max 4 MB</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-name`}>Display Name</Label>
              <Input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-email`}>Email</Label>
              <Input id={`${uid}-email`} value={user.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed in demo mode.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-phone`}>Phone</Label>
              <Input id={`${uid}-phone`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-bio`}>Bio</Label>
              <Textarea
                id={`${uid}-bio`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short note about yourself…"
                className="resize-none"
                rows={3}
              />
            </div>

            <Button onClick={handleSaveProfile} className="bg-brand hover:bg-brand-dark text-white self-end gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Save Profile
            </Button>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security" className="flex flex-col gap-4 mt-2">
            <div className="rounded-xl border p-4 bg-muted/20 flex flex-col gap-1">
              <span className="text-sm font-medium">Change Password</span>
              <span className="text-xs text-muted-foreground">Use at least 6 characters for your new password.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-cur-pw`}>Current Password</Label>
              <div className="relative">
                <Input
                  id={`${uid}-cur-pw`}
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-new-pw`}>New Password</Label>
              <div className="relative">
                <Input
                  id={`${uid}-new-pw`}
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
              {newPw.length > 0 && (
                <div className="flex gap-1 mt-1" role="img" aria-label="Password strength">
                  {[1, 2, 3, 4].map((i) => {
                    const strength =
                      newPw.length >= 12 && /[^a-zA-Z0-9]/.test(newPw)
                        ? 4
                        : newPw.length >= 10
                        ? 3
                        : newPw.length >= 6
                        ? 2
                        : 1;
                    const colors = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength - 1] : "bg-muted"}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-conf-pw`}>Confirm New Password</Label>
              <Input
                id={`${uid}-conf-pw`}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {confirmPw.length > 0 && newPw !== confirmPw && (
                <p className="text-xs text-destructive" role="alert">
                  Passwords do not match.
                </p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              className="bg-brand hover:bg-brand-dark text-white self-end gap-1.5"
              disabled={!currentPw || !newPw || !confirmPw || changingPassword}
            >
              <Lock className="size-4" aria-hidden="true" />
              {changingPassword ? "Changing…" : "Change Password"}
            </Button>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Sign Out</div>
                <div className="text-xs text-muted-foreground">Sign out of your account on this device.</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  logout();
                }}
              >
                Sign Out
              </Button>
            </div>
          </TabsContent>

          {/* APPEARANCE */}
          <TabsContent
            value="appearance"
            className="flex flex-col gap-5 mt-2 rounded-xl p-4 transition-colors duration-300"
            style={{ backgroundColor: `${accent}0d` }}
          >
            <div className="flex flex-col gap-3">
              <Label>Dashboard Theme</Label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      setAccent(t.accent);
                    }}
                    aria-pressed={theme === t.id}
                    className={`rounded-xl border-2 p-3 flex items-center gap-3 text-left transition-all ${
                      theme === t.id ? "border-brand bg-red-50/50" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`size-8 rounded-full ${t.bg} shrink-0 ring-2 ring-offset-2 ${theme === t.id ? t.ring : "ring-transparent"}`} />
                    <span className="text-sm font-medium">{t.label}</span>
                    {theme === t.id && <Check className="size-4 text-brand ml-auto shrink-0" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Accent Color</Label>
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccent(color)}
                    aria-label={`Accent color ${color}`}
                    aria-pressed={accent === color}
                    className={`size-8 rounded-full transition-transform hover:scale-110 ring-2 ring-offset-2 ${
                      accent === color ? "ring-foreground scale-110" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <label
                  className="size-8 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors overflow-hidden relative"
                  title="Custom color"
                >
                  <Palette className="size-3.5 text-muted-foreground absolute" aria-hidden="true" />
                  <span className="sr-only">Custom accent color</span>
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="opacity-0 absolute inset-0 cursor-pointer size-full"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-full ring-1 ring-border" style={{ backgroundColor: accent }} />
                <span className="text-xs text-muted-foreground font-mono">{accent}</span>
              </div>
            </div>

            <div
              className="rounded-xl p-4 text-white flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              <Avatar className="size-9 ring-2 ring-white/40">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-sm" style={{ background: "rgba(255,255,255,0.25)", color: "white" }}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs opacity-80 capitalize">{user.role}</div>
              </div>
              <span className="ml-auto text-xs opacity-70">Preview</span>
            </div>

            <Button onClick={handleSaveAppearance} className="bg-brand hover:bg-brand-dark text-white self-end gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Save Appearance
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
