import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import { CLERK_SIGN_IN_FALLBACK_REDIRECT_URL } from '../constants';
import { CLERK_AFTER_SIGNOUT_URL } from '../constants';
/**
 * @name LogTask.controller.Base
 */
export default class BaseController extends Controller {
    onInit(): void | undefined {
        this.ensureAuthenticated().then((authenticated: boolean) => {
            if(authenticated) {
                console.log("User Authenticated");
            } else {
                console.log("Authentication failed");
            }            
        });
    }
    protected async ensureAuthenticated(): Promise<boolean> {
        if(!window.ClerkReady) {
            console.error("ClerkReady Promise not found");
            return false;
        }

        const router = UIComponent.getRouterFor(this);

        if (!window.Clerk?.user) {
            router.navTo("login");
            return false;
        }
        
        return true;
    }

    onAfterRendering(): void | undefined {
        window.ClerkReady.then(() => {
            this._renderClerkComponent();
        });                
    }

    _renderClerkComponent(): void {
        if(!window.Clerk) {
            console.error("ClerkJS is not loaded");
            return;
        }
                

        if (window.Clerk.user && window.Clerk.session && window.Clerk.session.status == "active") {
            // If already signed in, redirect to home page
            const router = UIComponent.getRouterFor(this);
            router.navTo("home");            
            
            const user = document.getElementById("clerk-user");
            if (!user) {
                console.error("Could not find Clerk root element");
                return;
            }

            if(!user.innerHTML) {
                const div = document.createElement("div");
                user.appendChild(div);
                window.Clerk.mountUserButton(div, {
                    afterSignOutUrl: CLERK_AFTER_SIGNOUT_URL
                });
            }            
        } else {
            // Else, show sign-in form        
            
            const root = document.getElementById("clerk-root");

            if (!root) {
                console.error("Could not find Clerk root element");
                return;
            }

            if(!root.innerHTML) {
                const div = document.createElement("div");
                root.appendChild(div);
                window.Clerk.mountSignIn(div, {
                    routing: 'hash',
                    fallbackRedirectUrl: CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
                });
            }            
        }
    }
};