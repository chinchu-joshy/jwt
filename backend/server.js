const express=require('express')
const app=express()
const cors=require('cors')
const jwt=require('jsonwebtoken')
const port=process.env.PORT || 5000

app.use(express.json())
app.use(cors())

const users=[{
    id:"1",
    username:"chinchu",
     password:"123",
     isAdmin:true,
},{
    id:"2",
    username:"sandra",
     password:"1234",
     isAdmin:false,
}
]
let refreshtokens=[];
const generateaccesstoken=(user)=>{
    return jwt.sign({
        id:user.id,
        isAdmin:user.isAdmin
    },"secret key",{
        expiresIn:"15m"
    })
}
const refresaccesstocken=(user)=>{
    return jwt.sign({
        id:user.id,
        isAdmin:user.isAdmin
    },"refres secret key",{
        expiresIn:"15m"
    });
}
app.get('/',(req,res)=>{
    res.status(200).send("helo connected")
})
app.post('/login',(req,res)=>{
    const {username,password}=req.body
    const user=users.find((u)=>{
        return u.username=== username && u.password===password
    })
    if(user){
        const token=generateaccesstoken(user)
        const refresh=refresaccesstocken(user)
        refreshtokens.push(refresh)
        res.json({
            username:user.username,
            isAdmin:user.isAdmin,
            token,
            refresh
        })

    }else{
        res.status(400).json({error:"not correct"})
    }

})
const blockCheck=(req,res,next)=>{
    
}
const verify=(req,res,next)=>{
    const authHeader=req.headers.authorization
    if(authHeader){
       const token=authHeader.split(" ")[1]
       jwt.verify(token,"secret key",(err,user)=>{
           if(err){
               return res.status(403).json('token not valid'+err)
           }
           req.user=user;
           next()
       })
    }else{
        res.status(401).json('you are not authenticated')
    }
}
app.delete('/user/:id',verify,(req,res)=>{
    if(req.user.id===req.params.id && req.user.isAdmin){
res.status(200).json(req.user)
    }else{
        res.status(403).json('user is not deleted')
    }
})
app.post('/refresh',(req,res)=>{
    //take refresh token from user
     const refrestoken=req.body.token
    //send error if there is no token or it is invalid
      if(!refrestoken) return res.status(401).json('you are not authenticated')
      
       if(!refreshtokens.includes(refrestoken)){
           return res.status(403).json('refresh tocken is not valid')
       }
       jwt.verify(refrestoken,"refres secret key",(err,user)=>{
           err && console.log(err)
           refreshtokens=refreshtokens.filter(token=>token!==refrestoken)
           const newtoken=generateaccesstoken(user)
        const newrefresh=refresaccesstocken(user)
        refreshtokens.push(newrefresh)
        res.status(200).send({
            token:newtoken,
            refresh:newrefresh
        })
       })
    //if everything is ok , create new access token, refresh token and send to user
})
app.post('/logout',verify,(req,res)=>{
  let tokens=req.body.token
  refreshtokens=refreshtokens.filter((token)=>token !== tokens)
  res.status(200).json("logout")
})


app.listen(port,()=>{
    console.log('connected to the port 7000')
})
