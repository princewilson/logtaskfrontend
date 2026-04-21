import JSONModel from 'sap/ui/model/json/JSONModel';
import BaseController from './Base.controller';
import Input from 'sap/m/Input';
import ScrollContainer from 'sap/m/ScrollContainer';

export default class AppController extends BaseController {
    onInit(): void | undefined {
        console.log("AppController initialized");

        const oController = this;

        // UI model
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

        // Custom page header model
        let oCustomPageHeader = oController?.getOwnerComponent()?.getModel("customPageHeader") as JSONModel || undefined;
        if (!oCustomPageHeader) {
            oCustomPageHeader = new JSONModel({
                title: "",
                showNavButton: false
            });
            oController.getOwnerComponent()?.setModel(oCustomPageHeader, "customPageHeader");
        }

        // Chat model
        let oChatModel = oController?.getOwnerComponent()?.getModel("chat") as JSONModel || undefined;
        if (!oChatModel) {
            oChatModel = new JSONModel({
                open: false,
                input: "",
                messages: []
            });
            oController.getOwnerComponent()?.setModel(oChatModel, "chat");
        }
    }

    onChatOpen(): void {
        const oChatModel = this.getOwnerComponent()?.getModel("chat") as JSONModel;
        oChatModel.setProperty("/open", true);
    }

    onChatClose(): void {
        const oChatModel = this.getOwnerComponent()?.getModel("chat") as JSONModel;
        oChatModel.setProperty("/open", false);
    }

    async onChatSend(): Promise<void> {
        const oController = this;
        const oChatModel = oController.getOwnerComponent()?.getModel("chat") as JSONModel;

        const sInput = (oChatModel.getProperty("/input") as string || "").trim();
        if (!sInput) return;

        // Add user message to history
        const aMessages: Array<{ role: string; content: string }> = oChatModel.getProperty("/messages") || [];
        aMessages.push({ role: "user", content: sInput });
        oChatModel.setProperty("/messages", aMessages);
        oChatModel.setProperty("/input", "");

        // Scroll to bottom after user message renders
        oController._scrollChatToBottom();

        try {
            const oResponse = await oController.request("/chat", "POST", {
                message: sInput
            });

            if (oResponse?.reply) {
                aMessages.push({ role: "assistant", content: oResponse.reply });
                oChatModel.setProperty("/messages", [...aMessages]);
                oController._scrollChatToBottom();
            }
        } catch (err) {
            aMessages.push({ role: "assistant", content: "Sorry, something went wrong. Please try again." });
            oChatModel.setProperty("/messages", [...aMessages]);
            oController._scrollChatToBottom();
        }
    }

    private _scrollChatToBottom(): void {
        const oController = this;
        setTimeout(() => {
            const oScroll = oController.byId("chatScrollContainer") as ScrollContainer;
            if (!oScroll) return;
            const oDomRef = oScroll.getDomRef();
            if (!oDomRef) return;
            const oScrollable = (oDomRef.querySelector(".sapMScrollContScroll") as HTMLElement) || oDomRef;
            oScroll.scrollTo(0, oScrollable.scrollHeight, 0);
        }, 150);
    }
}
