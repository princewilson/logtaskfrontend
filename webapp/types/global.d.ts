import { ClerkObject } from "./clerk";

export {};

declare global {  
  interface Window {
    Clerk: ClerkObject;
    ClerkReady: Promise<void>;
  }
}
