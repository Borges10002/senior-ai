import { Router } from "express";
import { FeedbackController } from "../controller/FeedbackController";

const feedbackRoutes = Router();
const feedbackController = new FeedbackController();

// A visão de todos os feedbacks fica em /admin/feedbacks (módulo admin).
feedbackRoutes.get("/feedbacks", feedbackController.index);
feedbackRoutes.post("/feedbacks", feedbackController.create);
feedbackRoutes.put("/feedbacks/:id", feedbackController.update);
feedbackRoutes.delete("/feedbacks/:id", feedbackController.delete);

export default feedbackRoutes;
