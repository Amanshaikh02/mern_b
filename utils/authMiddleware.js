import jwt from "jsonwebtoken"
import secretKey from "../jwtConfig.js"

function AuthenticateToken(req,res,next){
    const authToken = req.header("Authorization")
    if(!authToken){
        return res.status(401).json({"message":"Authorization missing"})
    }
    const [bearer,token] = authToken.split(" ")
    if(bearer != "Bearer" || !token){
        return res.status(401).json({"message":"Invalid Token Format"})
    }

    jwt.verify(token,secretKey,(err,user)=>{
        if(err){
            return res.status(401).json({"message":"Invalid Token"})
        }

        req.user = user
        next()
    })
}

export default AuthenticateToken