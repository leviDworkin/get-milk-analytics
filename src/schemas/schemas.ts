
export enum SchemaTypes{
    ORDER,
    PRODUCT,
    DEPARTMENT,
    TRAIN,
    PRIOR
}

export interface Order{
    order_id:number;
    user_id:number;
    eval_set:"prior"|"train";
    order_number:number;
    order_dow:number;
    order_hour_of_day:number;
    days_since_prior_order:number;
}

export interface Product{
    product_id:number;
    product_name:string;
    aisle_id:number;
    department_id:number;
}

export interface Department{
    department_id:number;
    department:string;
}

export interface OrderProductSet{
    order_id:number;
    product_id:number;
    add_to_cart_order:number;
    reordered:number;
}