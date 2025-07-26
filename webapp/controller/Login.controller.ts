import BaseController from './Base.controller';

export default class LoginController extends BaseController {
    onAfterRendering(): void | undefined {
        const oController = this;
        oController.setHeaderTitle("Login Page");
    }
}