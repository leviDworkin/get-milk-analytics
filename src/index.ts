import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import trainRoute from "./routes/train-route";
import priorRoute from "./routes/prior-route";
import { prepareAnalytics } from "./analytics/BuildAnalyticsData";
import CsvDatabase from "../database/DataLoader";


const main =  async ()=>{
    const app = express();
    cors();
    app.use(bodyParser.json());

    const db = new CsvDatabase();
    await db.initDatabases();
    await prepareAnalytics(db);
    app.use("/train",trainRoute);
    app.use("/prior",priorRoute);
    
    const port = 3000;
    app.listen(port,()=>{
        console.log(`Server running on port: ${port}`);
    });
}

main();