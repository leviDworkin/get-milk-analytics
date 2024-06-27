import { Router } from "express";
import { finalPriorResult } from "../analytics/BuildAnalyticsData";

const priorRoute = Router();
priorRoute.get("",async (req,res)=>{
    res.send(finalPriorResult);
});

export default priorRoute;