import UIComponent from "sap/ui/core/UIComponent";
import { initConfig } from "./constants";
/**
 * @namespace LogTask
 */
export default class Component extends UIComponent {
    public static metadata = {
        "interfaces": ["sap.ui.core.IAsyncContentCreation"],
        "manifest": "json"
    };
    async init(): Promise<void> {
        // call the init function of the parent
        super.init();

        // load runtime config before initialising the router
        await initConfig();

        // creates the views based on URL/hash
        this.getRouter().initialize();
    };
};
