import BaseController from './Base.controller';

export default class LoginController extends BaseController {
    onInit(): void | undefined {
        console.log("LoginController initialized");
        const oController = this;

        // Listen for route match
        const oRouter = oController.getRouter();
        oRouter.getRoute("login")?.attachPatternMatched(this._onRouteMatched, this);
    }
    _onRouteMatched(): void {
        const oController = this;
        oController.appendHeader();
        oController.setHeaderTitle("Login Page");
        oController._renderClerkComponent();
    }

    onBeforeRendering(): void | undefined {
        console.log("Preparing Login Page");
    }
    onAfterRendering(): void | undefined {
        console.log("Rendering Login Page");
        const oController = this;
        oController._renderClerkComponent();
        if (window.Clerk && window.Clerk.user && window.Clerk.session && window.Clerk.session.status == "active") {
            // If already signed in, redirect to home page
            const router = oController.getRouter();
            router.navTo("home");
        }
    }

    onExit(): void | undefined {
        console.log("LoginController exited");
    }
}