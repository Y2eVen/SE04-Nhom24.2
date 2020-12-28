import express from "express";
import chatbotController from "../controllers/chatbotController";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", chatbotController.getHomepage);

    router.get("/webhook", chatbotController.getWebhook);
    router.post("/webhook", chatbotController.postWebhook);
    router.get("/db", chatbotController.getDb)

    return app.use("/" , router);

};

module.exports = initWebRoutes;