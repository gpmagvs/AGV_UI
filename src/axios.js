import axios from "axios";
import param from "./gpm_param";
import { ElMessage } from "element-plus";

const vcs_axios = axios.create({
    baseURL: param.backend_host
})
vcs_axios.interceptors.request.use(
    (config) => {
        console.info(config);
        console.log('攔截請求,url:' + config.url);
        return config
    },
    (err) => {
        console.log(err + '請求失敗')
        ElMessage.error({
            message: "請求失敗"
        })
        return Promise.reject(err);
    }
);


vcs_axios.interceptors.response.use(
    (res) => {
        console.log('攔截回應' + res.request);
        return res
    },
    (err) => {
        var config = err.config;
        console.log(err)

        ElMessage.error({
            message: `請求 /${config.url}回應失敗`
        })
        return Promise.reject(err);
    },

);

export default vcs_axios;