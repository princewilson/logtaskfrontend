import UIComponent from 'sap/ui/core/UIComponent';
import BaseController from './Base.controller';

export default class NotFoundController extends BaseController {
    onAfterRendering(): void | undefined {
        const oController = this;
        oController.setHeaderTitle("Not found Page");
    }

    onClickHome(oEvent: Event): void {
        const oController = this;
        const oRouter = UIComponent.getRouterFor(oController);
        oRouter.navTo("home");
    }
}