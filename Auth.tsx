import React, { useState } from 'react';
import { auth, GoogleAuthProvider } from './services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
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
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if (!name) throw new Error("Please enter your player name.");
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // Check if user is new
            const userExists = await dbService.getUserData(result.user.uid).catch(() => null);
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
                            <input id="email-reset" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3" />
                        </div>
                        {error && <p className="text-sm text-center text-cosmic-danger">{error}</p>}
                        {resetMessage && <p className="text-sm text-center text-cosmic-success">{resetMessage}</p>}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg">
                           {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                    <button onClick={() => setIsPasswordReset(false)} className="text-sm text-cosmic-primary hover:underline mt-4 block mx-auto">Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cosmic-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-cosmic-surface p-8 rounded-2xl border border-cosmic-border shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <StarIcon className="w-12 h-12 text-yellow-400 mx-auto" />
                    <h1 className="text-3xl font-bold text-cosmic-text-primary mt-4">Cosmic<span className="text-cosmic-primary">Cashflow</span></h1>
                    <p className="text-cosmic-text-secondary mt-1">{isLogin ? "Welcome back to the tournament!" : "Join the financial tournament!"}</p>
                </div>

                <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                     <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    Sign in with Google
                </button>
                <div className="flex items-center my-6">
                    <hr className="flex-grow border-cosmic-border"/><span className="mx-4 text-xs text-cosmic-text-secondary">OR</span><hr className="flex-grow border-cosmic-border"/>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Player Name</label>
                            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3" required={!isLogin}/>
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Email</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3" required />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-cosmic-text-secondary mb-1">Password</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3" required />
                    </div>
                    
                    {error && <p className="text-sm text-center text-cosmic-danger">{error}</p>}
                    
                    {isLogin && <button type="button" onClick={() => setIsPasswordReset(true)} className="text-xs text-cosmic-primary hover:underline block w-full text-right">Forgot Password?</button>}

                    <button type="submit" disabled={isLoading} className="w-full flex justify-center bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg">
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-sm text-cosmic-primary hover:underline">
                        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;