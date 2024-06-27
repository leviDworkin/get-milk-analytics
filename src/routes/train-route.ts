import { Router } from "express";
import { finalTrainResult } from "../analytics/BuildAnalyticsData";

const trainRoute = Router();
trainRoute.get("",async (req,res)=>{
    res.send(finalTrainResult);
});

export default trainRoute;