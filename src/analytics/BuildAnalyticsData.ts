import CsvDatabase from "../../database/DataLoader";
import { Department, Order } from "../schemas/schemas";

interface DepartmentPopularityHour{
    departmentTrackerDict:Record< number,DepartmentPopularity >,
    sumUsersPerHour:number
}

interface DepartmentPopularity{
    department:Department;
    users:Set<number>;
    percentage?:number;
}

export const mostPopularTrainDict:Record< number,Record< number, DepartmentPopularityHour > > = {};
const mostPopularPriorDict:Record< number,Record< number, DepartmentPopularityHour > > = {};

const trainHelperDict:Record< string,Record< string, Array<DepartmentPopularity> > > = {};
const priorHelperDict:Record< string,Record< string, Array<DepartmentPopularity> > > = {};

export let finalTrainResult:Record< string,Record< string, Array<string> > > = {};
export let finalPriorResult:Record< string,Record< string, Array<string> > > = {};

const buildAnalytics = async (db:CsvDatabase)=>{
    return new Promise<void>((res,rej)=>{
        try {
            db.ordersTable.forEach((order:Order)=>{
            const orderId = order.order_id;

            const productId = order.eval_set === "train" ? db.trainDict[orderId]?.product_id : db.priorDict[orderId]?.product_id;
            if(productId == null){
                return;
            }
            const departmentId = db.productDict[productId].department_id;
            const department = db.departmentDict[departmentId];
            
            const day = order.order_dow;
            const hour = order.order_hour_of_day;

            const mostPopularDict = order.eval_set === "train" ? mostPopularTrainDict : mostPopularPriorDict;
            const helperDict = order.eval_set === "train" ? trainHelperDict : priorHelperDict;
    
            if(!mostPopularDict[day]){
                mostPopularDict[day] = {};
                helperDict[day] = {};
            }
    
            if(!mostPopularDict[day][hour]){
                mostPopularDict[day][hour] = {
                    departmentTrackerDict: {},
                    sumUsersPerHour:0
                };
                helperDict[day][hour] = [];
            }
            
            if(!mostPopularDict[day][hour].departmentTrackerDict[departmentId]){
                mostPopularDict[day][hour].departmentTrackerDict[departmentId] = {
                    department: department,
                    users: new Set<number>()
                };
            }
    
            const depPop =  mostPopularDict[day][hour].departmentTrackerDict[departmentId];
            if(!depPop.users.has(order.user_id)){
                mostPopularDict[day][hour].sumUsersPerHour += 1;
            }
    
            depPop.users.add(order.user_id);
        });
        res();
        } catch (error) {
            console.error(error);
            rej();
        }
    });
};

const calculatePercentages = (isTrain:boolean)=>{
    return new Promise<Record< string,Record< string, Array<string> > >>((res,rej)=>{
        try {
            const mostPopularDict = isTrain ? mostPopularTrainDict : mostPopularPriorDict;
            const helperDict = isTrain ? trainHelperDict : priorHelperDict;

            for(let day in mostPopularDict){
                for(let hour in mostPopularDict[day]){
                    
                    const depPopHourDict = mostPopularDict[day][hour];
                   
                    for(let departmentId in depPopHourDict.departmentTrackerDict){
                        
                        const depData = depPopHourDict.departmentTrackerDict[departmentId];
                        
                        const percentage = Math.round((depData.users.size * 100) / depPopHourDict.sumUsersPerHour);
                        depPopHourDict.departmentTrackerDict[departmentId].percentage = percentage;
                        
                        helperDict[day][hour].push(depData);
                    }
                    helperDict[day][hour].sort((a,b)=>((a.percentage != null && b.percentage != null && a.percentage > b.percentage) ? -1 : 1));
                }
            }

            const resultDict:Record< string,Record< string, Array<string> > > = {};
            
            for(let day=0; day<=6; day++){
                const dayKey = `Day ${day}`;
                if(!helperDict[day]){
                    continue;
                }

                if(!resultDict[dayKey]){
                    resultDict[dayKey] = {};
                }
                for(let hour=0; hour<=23; hour++){

                    if(!helperDict[day][hour]){
                        continue;
                    }

                    const hourKey = `Hour ${hour}`;
                    if(!resultDict[dayKey][hourKey]){
                        resultDict[dayKey][hourKey] = [];
                    }
                    helperDict[day][hour].forEach((depData,index)=>{
                        const str = `${index+1}. ${depData.department.department}(${depData.percentage}%)`;
                        resultDict[dayKey][hourKey].push(str);
                    });
                }
            }

            res(resultDict);
        } catch (error) {
            console.error(error);
            rej(null);
        }
    });
}

export const prepareAnalytics = async (db:CsvDatabase)=>{
    console.log("Building analytics...");
    await buildAnalytics(db);
    const promiseArr = [await calculatePercentages(true),await calculatePercentages(false)];
    const resultArr = await Promise.all(promiseArr);
    finalTrainResult = resultArr[0];
    finalPriorResult = resultArr[1];
    console.log("Analytics are ready!");
}