import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
/**
 * @namespace LogTask
 */
export default class Component extends UIComponent {
    public static metadata = {
        "interfaces": ["sap.ui.core.IAsyncContentCreation"],
        "manifest": "json"
    };
    init(): void {
        // call the init function of the parent
        super.init();

        const oJSON = {
            "headerTitle": ""
        }
        const oModel = new JSONModel();
        oModel.setData(oJSON);

        // set the model
        this.setModel(oModel);

        // creates the views based on URL/hash
        this.getRouter().initialize();
    };
};