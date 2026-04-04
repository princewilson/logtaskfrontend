import JSONModel from 'sap/ui/model/json/JSONModel';
import BaseController from './Base.controller'

export default class AppController extends BaseController {
    onInit(): void | undefined {
        console.log("AppController initialized");

        const oController = this;
        let oUIModel = oController?.getOwnerComponent()?.getModel("ui") as JSONModel || undefined;

        if (!oUIModel) {
            oUIModel = new JSONModel({
                edit: false,
                busy: false,
                dirty: false,
                canCreate: true
            });
            oController.getOwnerComponent()?.setModel(oUIModel, "ui");
        }

        let oCustomPageHeader = oController?.getOwnerComponent()?.getModel("customPageHeader") as JSONModel || undefined;
        if (!oCustomPageHeader) {
            oCustomPageHeader = new JSONModel({
                title: "",
                showNavButton: false
            });
            oController.getOwnerComponent()?.setModel(oCustomPageHeader, "customPageHeader");
        }
    }
}