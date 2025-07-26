import BaseController from './Base.controller'

export default class HomeController extends BaseController {
    onAfterRendering(): void | undefined {
        const oController = this;
        oController.setHeaderTitle("Home Page");
    }
}