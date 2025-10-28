import React, { useState } from 'react';
import { auth } from './services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import * as dbService from './services/dbService';
import { StarIcon } from './components/icons';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                // onAuthStateChanged in App.tsx will handle the rest
            } else {
                if (!name) {
                    setError("Please enter your name.");
                    setIsLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await dbService.createNewUser(userCredential.user.uid, name, email);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cosmic-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-cosmic-surface p-8 rounded-2xl border border-cosmic-border shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <StarIcon className="w-12 h-12 text-yellow-400 mx-auto" />
                    <h1 className="text-3xl font-bold text-cosmic-text-primary mt-4">Cosmic<span className="text-cosmic-primary">Cashflow</span></h1>
                    <p className="text-cosmic-text-secondary mt-1">{isLogin ? "Welcome back to the tournament!" : "Join the financial tournament!"}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Player Name</label>
                            <input
                                id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Email</label>
                        <input
                            id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-cosmic-text-secondary mb-1">Password</label>
                        <input
                            id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-3 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                            required
                        />
                    </div>
                    
                    {error && <p className="text-sm text-center text-cosmic-danger">{error}</p>}

                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-400 transition-colors disabled:bg-cosmic-border">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>
                    </div>
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