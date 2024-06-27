import * as fs from "fs";
import { Department, Order, OrderProductSet, Product, SchemaTypes } from "../src/schemas/schemas";
import csvParser from "csv-parser";


class CsvDatabase{
    public ordersTable:Order[] = [];
    public trainDict:Record<number,OrderProductSet> = {};
    public priorDict:Record<number,OrderProductSet> = {};
    public productDict:Record<number,Product> = {};
    public departmentDict:Record<number,Department> = {};

    public constructor(){}

    private storeData = (data:any, type:SchemaTypes)=>{
        switch(type){
            case SchemaTypes.ORDER:
                this.ordersTable.push(data);
                break;
            case SchemaTypes.DEPARTMENT:
                this.departmentDict[(data as Department).department_id] = data;
                break;
            case SchemaTypes.PRODUCT:
                this.productDict[(data as Product).product_id] = data;
                break;
            case SchemaTypes.TRAIN:
                this.trainDict[(data as OrderProductSet).order_id] = data;
                break;
            case SchemaTypes.PRIOR:
                this.priorDict[(data as OrderProductSet).order_id] = data;
                break;
        }
    }
    
    private loadDatabase = async (filename:string, type:SchemaTypes):Promise<void>=>{
        const tableTypeArr:any[] = [];
    
        return new Promise<void>((res,rej)=>{
            try {
                fs.createReadStream(__dirname+filename)
                .pipe(csvParser({headers: true}))
                .on("data",data=>{
                    const firstRow = tableTypeArr.length === 0;
                    const saveData:any = {};
                    for(let key in data){
                        if(firstRow){
                            tableTypeArr.push(data[key]);
                        }   else{
                            const index = parseInt(key.replace("_",""));
                            saveData[tableTypeArr[index]] = data[key];
                        } 
                    }
                    if(firstRow){
                        return;
                    }
                    this.storeData(saveData, type);
                })
                .on("error",error=>console.error(error))
                .on("end",()=>{
                    console.log("Finished loading table: ",filename);
                    res();
                });    
            } catch (error) {
                console.error(error);
                rej();
            }
        });
    }

    public initDatabases = async ()=>{
        console.log("Start load data...");
        const promises = new Array<Promise<void>>();
        promises.push(this.loadDatabase("/orders.csv", SchemaTypes.ORDER));
        promises.push(this.loadDatabase("/departments.csv",SchemaTypes.DEPARTMENT));
        promises.push(this.loadDatabase("/products.csv",SchemaTypes.PRODUCT));
        promises.push(this.loadDatabase("/order_products__train.csv",SchemaTypes.TRAIN));
        promises.push(this.loadDatabase("/order_products__prior.csv",SchemaTypes.PRIOR));
        await Promise.all(promises);
        
        console.log("All databases finished loading");
    }
}

export default CsvDatabase;