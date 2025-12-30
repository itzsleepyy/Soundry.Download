'use client';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Key for storage
const SESSION_KEY = 'soundry_session';

export default function SessionInit() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            let token = localStorage.getItem(SESSION_KEY);
            if (!token) {
                token = uuidv4();
                localStorage.setItem(SESSION_KEY, token);
            }
        }
    }, []);

    return null;
}

export function getSessionToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem(SESSION_KEY);
    }
    return null;
}
