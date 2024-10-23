const ResponseFormatter = require('../utils/responseFormatter');
const formatter = new ResponseFormatter();

const routesMiddlewares = {
    validateRequest: function (requestSchema) {
        return (req, res, next) => {
            req.admin_Ip = req.socket.remoteAddress;
            const validations = ['params', 'headers', 'query', 'body']
                .map(key => {
                    const schema = requestSchema[key];
                    const value = req[key];
                    if (schema) {
                        const {error}=  schema.validate(value);
                        if(error){
                                const {details}=error;
                                const message=details.map(i=>i.message).join(',');
                                var finalRes=formatter.formatResponse({},0,message,false);
                                return res.send(finalRes);
                        }else{
                            next();
                        }
                    }
                })
        }
    }
}

module.exports=routesMiddlewares;