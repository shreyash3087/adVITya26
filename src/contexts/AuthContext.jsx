import { createContext, useContext, useEffect, useState } from 'react';
import { account, databases } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            const secret = urlParams.get('secret');

            if (userId && secret) {
                await account.updateMagicURLSession(userId, secret);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const accountDetails = await account.get();
            setUser(accountDetails);

            const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

            if (DATABASE_ID && USERS_COLLECTION_ID) {
                try {
                    const userDoc = await databases.getDocument(
                        DATABASE_ID,
                        USERS_COLLECTION_ID,
                        accountDetails.$id
                    );

                    setUserData({
                        ...userDoc,
                        type: userDoc.role,
                        email: accountDetails.email,
                    });
                } catch (error) {
                    if (error.code === 404) {
                        try {
                            const newUserDoc = await databases.createDocument(
                                DATABASE_ID,
                                USERS_COLLECTION_ID,
                                accountDetails.$id,
                                {
                                    email: accountDetails.email,
                                    role: 'member',
                                    name: accountDetails.name,
                                }
                            );
                            setUserData({
                                ...newUserDoc,
                                type: 'member',
                                email: accountDetails.email,
                            });
                        } catch (createError) {
                            console.error("Failed to create user document:", createError);

                            setUserData({
                                type: 'member',
                                email: accountDetails.email,
                                ...accountDetails
                            });
                        }
                    } else {
                        console.error("Error fetching user document:", error);

                        setUserData({
                            type: 'member',
                            email: accountDetails.email,
                            ...accountDetails
                        });
                    }
                }
            } else {
                console.warn("Appwrite Database/Collection IDs missing in .env");
                let userType = 'member';
                if (accountDetails.labels && accountDetails.labels.includes('admin')) {
                    userType = 'admin';
                }
                setUserData({
                    type: userType,
                    email: accountDetails.email,
                    ...accountDetails
                });
            }

        } catch (error) {
            setUser(null);
            setUserData(null);
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        try {
            await account.createOAuth2Session(
                OAuthProvider.Google,
                `${window.location.origin}/dashboard`,
                `${window.location.origin}/login`
            );
        } catch (error) {
            console.error(error);
        }
    };

    const loginWithMagicLink = async (email) => {
        try {
            await account.createMagicURLToken(
                'unique()',
                email,
                `${window.location.origin}/dashboard`
            );
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error };
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            setUserData(null);
        } catch (error) {
            console.error(error);
        }
    };

    const value = {
        user,
        userData,
        loading,
        loginWithGoogle,
        loginWithMagicLink,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
