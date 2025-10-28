import React, { useState } from 'react';
import { auth, firebaseAuth } from './services/firebase';
import * as dbService from './services/dbService';
import { StarIcon } from './components/icons';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // FIX: Use functions from the firebaseAuth namespace.
                await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
            } else {
                if (!name) throw new Error("Please enter your player name.");
                // FIX: Use functions from the firebaseAuth namespace.
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
                await dbService.createNewUser(userCredential.user.uid, name, email);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        // FIX: Use functions from the firebaseAuth namespace.
        const provider = new firebaseAuth.GoogleAuthProvider();
        try {
            // FIX: Use functions from the firebaseAuth namespace.
            const result = await firebaseAuth.signInWithPopup(auth, provider);
            // Check if user is new
            const userExists = await dbService.getUserData(result.user.uid);
            if (!userExists) {
                await dbService.createNewUser(result.user.uid, result.user.displayName || 'New Player', result.user.email!);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!email) {
            setError("Please enter your email address to reset the password.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResetMessage('');
        try {
            await dbService.resetPassword(email);
            setResetMessage("Password reset email sent! Check your inbox.");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }
    
    if (isPasswordReset) {
         return (
             <div className="min-h-screen bg-cosmic-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-cosmic-surface p-8 rounded-2xl border border-cosmic-border shadow-2xl">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary text-center">Reset Password</h2>
                    <form onSubmit={handlePasswordReset} className="space-y-6 mt-6">
                        <p className="text-sm text-cosmic-text-secondary">Enter your email and we'll send you a link to get back into your account.</p>
                         <div>
                            <label htmlFor="email-reset" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Email</label>
                            {/* FIX: Corrected onChange handler to use e.target.value and completed the component JSX. */}
                            <input id="email-reset" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        {resetMessage && <p className="text-sm text-green-500 text-center">{resetMessage}</p>}
                        <div className="space-y-2">
                            <button type="submit" disabled={isLoading} className="w-full bg-cosmic-primary text-white font-bold py-2 rounded-lg hover:bg-blue-400 disabled:bg-cosmic-border">
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                            <button type="button" onClick={() => setIsPasswordReset(false)} className="w-full text-center text-sm text-cosmic-text-secondary hover:text-cosmic-primary">
                                Back to Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
         )
    }

    return (
        <div className="min-h-screen bg-cosmic-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-cosmic-surface p-8 rounded-2xl border border-cosmic-border shadow-2xl">
                <div className="text-center mb-6">
                    <StarIcon className="w-10 h-10 text-yellow-400 mx-auto" />
                    <h1 className="text-3xl font-bold text-cosmic-text-primary mt-2">Cosmic<span className="text-cosmic-primary">Cashflow</span></h1>
                    <p className="text-cosmic-text-secondary mt-1">{isLogin ? 'Sign in to continue your journey' : 'Create an account to begin'}</p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Player Name</label>
                            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Email</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Password</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    
                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full bg-cosmic-primary text-white font-bold py-3 rounded-lg hover:bg-blue-400 disabled:bg-cosmic-border">
                            {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </div>
                </form>

                <div className="flex items-center my-6">
                    <hr className="flex-grow border-cosmic-border" />
                    <span className="mx-4 text-xs text-cosmic-text-secondary">OR</span>
                    <hr className="flex-grow border-cosmic-border" />
                </div>

                <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-cosmic-bg border border-cosmic-border py-2.5 rounded-lg hover:bg-cosmic-border">
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.319-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l6.19 5.238C42.021 35.596 44 30.035 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    <span className="font-semibold text-cosmic-text-primary">Sign in with Google</span>
                </button>
                
                <div className="text-center mt-6 text-sm">
                    {isLogin ? (
                        <p className="text-cosmic-text-secondary">
                            Don't have an account? <button onClick={() => { setIsLogin(false); setError(null); }} className="font-semibold text-cosmic-primary hover:underline">Sign Up</button>
                        </p>
                    ) : (
                        <p className="text-cosmic-text-secondary">
                            Already have an account? <button onClick={() => { setIsLogin(true); setError(null); }} className="font-semibold text-cosmic-primary hover:underline">Sign In</button>
                        </p>
                    )}
                     <p className="text-cosmic-text-secondary mt-2">
                        Forgot your password? <button onClick={() => setIsPasswordReset(true)} className="font-semibold text-cosmic-primary hover:underline">Reset it</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

// FIX: Added default export.
export default Auth;