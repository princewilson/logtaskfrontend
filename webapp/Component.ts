import UIComponent from "sap/ui/core/UIComponent";

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
                
        // creates the views based on URL/hash
        this.getRouter().initialize();
    };
};