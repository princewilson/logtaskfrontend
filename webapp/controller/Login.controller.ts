import BaseController from './Base.controller';
import HTML from 'sap/ui/core/HTML';

export default class LoginController extends BaseController {
    onInit(): void | undefined {
        console.log("LoginController onInit");
        const oController = this;

        const oClerkRoot = oController?.getView()?.byId("clerkContainer") as HTML;
        if (oClerkRoot) {
            oClerkRoot.addEventDelegate({
                onAfterRendering: function () {
                    oController._renderClerkComponent();
                }
            });
        }
        // Listen for route match
        const oRouter = oController.getRouter();
        oRouter.getRoute("login")?.attachPatternMatched(this._onRouteMatched, this);
    }
    _onRouteMatched(): void {
        const oController = this;

        oController.setHeaderTitle("loginPageTitle"); // Assuming "loginPageTitle" is defined in i18n        
        if (window.Clerk.isSignedIn) {
            // If already signed in, redirect to home page
            const router = oController.getRouter();
            router.navTo("home");
        }
    }

    onBeforeRendering(): void | undefined {
        console.log("Login Controller onBeforeRendering");
    }
    onAfterRendering(): void | undefined {
        console.log("Login Controller onAfterRendering");
        const oController = this;
        oController.appendHeader();
    }

    onExit(): void | undefined {
        console.log("LoginController onExit");
    }
}