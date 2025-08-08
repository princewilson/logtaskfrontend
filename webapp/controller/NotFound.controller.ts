import UIComponent from 'sap/ui/core/UIComponent';
import BaseController from './Base.controller';

export default class NotFoundController extends BaseController {
    onInit(): void | undefined {
        console.log("NotFoundController initialized");
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
        // Listen for bypassed event (for not found routes)
        oRouter.attachBypassed(this._onBypassed, this);
    }
    _onBypassed(): void {
        const oController = this;
        oController.appendHeader();
        oController.setHeaderTitle("Not found Page");
        oController._renderClerkComponent();
    }

    onBeforeRendering(): void | undefined {
        console.log("Preparing Not Found Page");
    }
    onAfterRendering(): void | undefined {
        console.log("Rendering Not Found Page");
        const oController = this;
        oController._renderClerkComponent();
    }
    onExit(): void | undefined {
        console.log("NotFoundController exited");
    }
    onClickHome(oEvent: Event): void {
        const oController = this;
        const oRouter = UIComponent.getRouterFor(oController);
        oRouter.navTo("home");
    }
}