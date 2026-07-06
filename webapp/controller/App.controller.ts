import JSONModel from 'sap/ui/model/json/JSONModel';
import BaseController from './Base.controller';
import Input from 'sap/m/Input';
import ScrollContainer from 'sap/m/ScrollContainer';
import MessageToast from 'sap/m/MessageToast';
import Event from 'sap/ui/base/Event';
import Control from 'sap/ui/core/Control';

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

        // Build history from prior messages (raw text only, drop html field), capped to last 20.
        const aMessages: Array<{ role: string; content: string; html?: string; confirmation?: { title: string; description: string; status: string } }> = oChatModel.getProperty("/messages") || [];
        const aHistory = aMessages
            .map(m => {
                // For AI-proposed goals, represent the *resolved outcome* in history so the
                // model knows whether the goal was actually added. Without this it can't tell
                // a proposal apart from a completed action, and re-proposes the same goal.
                if (m.confirmation) {
                    const sTitle = m.confirmation.title;
                    if (m.confirmation.status === "confirmed") {
                        return { role: m.role, content: `I added the goal "${sTitle}" to the user's goals.` };
                    }
                    if (m.confirmation.status === "cancelled") {
                        return { role: m.role, content: `I proposed the goal "${sTitle}", but the user chose not to add it.` };
                    }
                    return { role: m.role, content: `I proposed the goal "${sTitle}" and am waiting for the user to confirm.` };
                }
                return { role: m.role, content: m.content };
            })
            .slice(-20);

        // Add user message to display list
        aMessages.push({ role: "user", content: sInput });
        oChatModel.setProperty("/messages", aMessages);
        oChatModel.setProperty("/input", "");

        // Scroll to bottom after user message renders
        oController._scrollChatToBottom();

        try {
            const oResponse = await oController.request("/chat", "POST", {
                message: sInput,
                history: aHistory
            });

            if (oResponse?.type === "confirmation" && oResponse?.proposal) {
                // AI is proposing a goal. Show a confirmation card; nothing is saved yet.
                aMessages.push({
                    role: "assistant",
                    content: oResponse.reply || "I'd like to add this goal:",
                    html: oResponse.html || oResponse.reply || "",
                    confirmation: {
                        title: oResponse.proposal.title,
                        description: oResponse.proposal.description,
                        status: "pending"
                    }
                });
                oChatModel.setProperty("/messages", [...aMessages]);
                oController._scrollChatToBottom();
            } else if (oResponse?.reply) {
                aMessages.push({
                    role: "assistant",
                    content: oResponse.reply,
                    html: oResponse.html || oResponse.reply
                });
                oChatModel.setProperty("/messages", [...aMessages]);
                oController._scrollChatToBottom();
            }
        } catch (err) {
            aMessages.push({
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
                html: "<p>Sorry, something went wrong. Please try again.</p>"
            });
            oChatModel.setProperty("/messages", [...aMessages]);
            oController._scrollChatToBottom();
        }
    }

    /**
     * Confirm an AI-proposed goal. The proposal originally came from the model, but the
     * actual write goes through the same authenticated, validated POST /goals endpoint a
     * manual goal creation uses. The server re-validates title/description at that boundary.
     */
    async onChatConfirmGoal(oEvent: Event): Promise<void> {
        const oController = this;
        const oChatModel = oController.getOwnerComponent()?.getModel("chat") as JSONModel;

        const oCtx = (oEvent.getSource() as Control).getBindingContext("chat");
        if (!oCtx) return;
        const sPath = oCtx.getPath();

        const oConfirmation = oChatModel.getProperty(sPath + "/confirmation") as
            { title: string; description: string; status: string } | undefined;
        if (!oConfirmation || oConfirmation.status !== "pending") return;

        try {
            await oController.request("/goals", "POST", {
                title: oConfirmation.title,
                description: oConfirmation.description
            });
            oChatModel.setProperty(sPath + "/confirmation/status", "confirmed");
            MessageToast.show("Goal added");
            oController._scrollChatToBottom();
        } catch (err) {
            // request() already surfaces 400/401 errors to the user. Leave the card in
            // 'pending' so they can retry or cancel.
        }
    }

    /**
     * Dismiss an AI-proposed goal without saving. No backend call is made.
     */
    onChatCancelGoal(oEvent: Event): void {
        const oController = this;
        const oChatModel = oController.getOwnerComponent()?.getModel("chat") as JSONModel;

        const oCtx = (oEvent.getSource() as Control).getBindingContext("chat");
        if (!oCtx) return;
        const sPath = oCtx.getPath();

        const oConfirmation = oChatModel.getProperty(sPath + "/confirmation") as
            { status: string } | undefined;
        if (!oConfirmation || oConfirmation.status !== "pending") return;

        oChatModel.setProperty(sPath + "/confirmation/status", "cancelled");
        oController._scrollChatToBottom();
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
