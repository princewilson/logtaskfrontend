import BaseController from './Base.controller'

export default class HomeController extends BaseController {
    onInit(): void | undefined {
        console.log("HomeController initialized");
        const oController = this;
        oController.ensureAuthenticated().then((authenticated: boolean) => {
            if (authenticated) {
                console.log("User Authenticated");
            } else {
                console.log("Authentication failed");
            }
        });

        // Listen for route match
        const oRouter = oController.getRouter();
        oRouter.getRoute("home")?.attachPatternMatched(this._onRouteMatched, this);
    }
    _onRouteMatched(): void {
        const oController = this;
        oController.appendHeader();
        oController.setHeaderTitle("homePageTitle"); // Assuming "homePageTitle" is defined in i18n
        oController._renderClerkComponent();
    }

    onBeforeRendering(): void | undefined {
        console.log("Preparing Home Page");
    }
    onAfterRendering(): void | undefined {
        console.log("Rendering Home Page");
        const oController = this;
        oController._renderClerkComponent();
    }

    onExit(): void | undefined {
        console.log("HomeController exited");
    }
}