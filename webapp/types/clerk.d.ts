export type RoutingType = 'hash' | 'path';
export type SessionStatus = 'active' | 'Expired';

interface SignInProps {
    routing?: RoutingType;
    fallbackRedirectUrl?: string;
    signUpFallbackRedirectUrl?: string;
    forceRedirectUrl?: string;
}

interface UserButtonProps {
    afterSignOutUrl?: string;
}

interface SessionProps {
    status?: SessionStatus;
    getToken(): Promise<string | null>;
}

export interface ClerkObject {
    load: () => Promise<void>;
    user: any;
    session: SessionProps;
    mountSignIn: (node: HTMLElement, props?: SignInProps) => void;
    mountUserButton: (node: HTMLElement, props?: UserButtonProps) => void;
}