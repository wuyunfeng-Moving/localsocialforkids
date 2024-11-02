import { KidInfo, UserInfo } from "./types";

//描述查询服务器信息的类型
export type InfoSearchParams = {
    userId?:number[];
    kidId?:number[];
}

//描述服务器返回查询Info的类型
export type InfoSearchResponse = {
    success: boolean;
    message: string;
    userInfo?: UserInfo[];
    kidInfo?:KidInfo[];
}