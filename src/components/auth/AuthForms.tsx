import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { Divider } from "../ui/Divider";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "../../lib/firebase/client";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authChecking, setAuthChecking] = useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "/dashboard";
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsub();
  }, []);

  if (authChecking) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully signed in");
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Update/Create user in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  return (
    <Card className="w-full max-w-[400px] mx-auto p-8 border-none md:border-4 md:border-black shadow-none md:shadow-[8px_8px_0px_0px_#000] bg-transparent md:bg-white rounded-none">
      <div className="flex flex-col items-center mb-8">
        <span className="text-[32px] font-bold text-black leading-none mb-2 uppercase">
          Carouseln
        </span>
        <h1 className="text-[18px] font-bold text-gray-600 m-0 uppercase">
          Sign in to your account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-[13px] font-ui text-[var(--color-text-secondary)]">Email</label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="login-password" className="text-[13px] font-ui text-[var(--color-text-secondary)]">Password</label>
            <a href="/forgot-password" className="text-[13px] font-ui text-[var(--color-gold)] hover:text-[#D4B55A] transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-black rounded"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={loading} className="w-full mt-2">
          Sign In
        </Button>
      </form>

      <div className="my-6 relative flex items-center justify-center">
        <Divider className="absolute inset-0 top-1/2 -translate-y-1/2" />
        <span className="relative bg-[var(--color-surface)] px-3 text-[13px] font-ui text-[var(--color-text-muted)] z-10">
          or
        </span>
      </div>

      <Button type="button" variant="secondary" className="w-full mb-6" onClick={handleGoogleAuth}>
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </Button>

      <p className="text-center text-[13px] font-ui text-[var(--color-text-secondary)] m-0">
        Don’t have an account? <a href="/signup" className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)] transition-colors">Sign up</a>
      </p>
    </Card>
  );
};

export const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [authChecking, setAuthChecking] = useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "/dashboard";
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsub();
  }, []);

  if (authChecking) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Password strength (0 to 4)
  const strength = Math.min(4, Math.floor(password.length / 3) + (/[A-Z]/.test(password) ? 1 : 0) + (/[0-9]/.test(password) ? 1 : 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!agreed) {
      toast.error("You must agree to the Terms of Service");
      return;
    }
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: user.email,
        name: name,
        plan: "Free",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        // GDPR Art. 7(1) — Proof of Consent audit trail
        consentGranted: true,
        consentTimestamp: serverTimestamp(),
        consentPolicyVersion: "1.0",
      });
      
      toast.success("Account created successfully!");
      window.location.href = "/onboarding";
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Update/Create user in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        plan: "Free",
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      window.location.href = "/onboarding";
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  return (
    <Card className="w-full max-w-[400px] mx-auto p-8 border-none md:border-4 md:border-black shadow-none md:shadow-[8px_8px_0px_0px_#000] bg-transparent md:bg-white rounded-none">
      <div className="flex flex-col items-center mb-8">
        <span className="text-[32px] font-bold text-black leading-none mb-2 uppercase">
          Carouseln
        </span>
        <h1 className="text-[18px] font-bold text-gray-600 m-0 uppercase">
          Create your account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-name" className="text-[13px] font-ui text-[var(--color-text-secondary)]">Full Name</label>
          <Input id="signup-name" name="name" type="text" autoComplete="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-[13px] font-ui text-[var(--color-text-secondary)]">Email</label>
          <Input id="signup-email" name="email" type="email" autoComplete="email" spellCheck={false} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-password" className="text-[13px] font-ui text-[var(--color-text-secondary)]">Password</label>
          <div className="relative">
            <Input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-black rounded"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4].map(level => (
              <div 
                key={level} 
                className={`h-1 flex-1 rounded-full ${password.length > 0 && strength >= level ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-border)]'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-ui text-[var(--color-text-secondary)]">Confirm Password</label>
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <label className="flex items-start gap-2 mt-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-[var(--color-gold)]"
          />
          <span className="text-[13px] font-ui text-[var(--color-text-secondary)]">
            I agree to the <a href="/terms" target="_blank" className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)]">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)]">Privacy Policy</a>
          </span>
        </label>

        <Button type="submit" isLoading={loading} className="w-full mt-2">
          Create Account
        </Button>
      </form>

      <div className="my-6 relative flex items-center justify-center">
        <Divider className="absolute inset-0 top-1/2 -translate-y-1/2" />
        <span className="relative bg-[var(--color-surface)] px-3 text-[13px] font-ui text-[var(--color-text-muted)] z-10">
          or
        </span>
      </div>

      <Button type="button" variant="secondary" className="w-full mb-6" onClick={handleGoogleAuth}>
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </Button>

      <p className="text-center text-[13px] font-ui text-[var(--color-text-secondary)] m-0">
        Already have an account? <a href="/login" className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)] transition-colors">Sign in</a>
      </p>
    </Card>
  );
};

export const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset link sent if account exists");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[400px] mx-auto p-8 border-none md:border-4 md:border-black shadow-none md:shadow-[8px_8px_0px_0px_#000] bg-transparent md:bg-white rounded-none">
      <div className="flex flex-col items-center mb-8">
        <span className="text-[32px] font-bold text-black leading-none mb-2 uppercase">
          Carouseln
        </span>
        <h1 className="text-[18px] font-bold text-gray-600 m-0 uppercase">
          Reset your password
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-email" className="text-[13px] font-ui text-[var(--color-text-secondary)]">Email</label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" isLoading={loading} className="w-full mt-2">
          Send reset link
        </Button>
      </form>

      <p className="text-center text-[13px] font-ui text-[var(--color-text-secondary)] mt-8 mb-0">
        <a href="/login" className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)] transition-colors">Back to login</a>
      </p>
    </Card>
  );
};
