const jwt = require('jsonwebtoken');


const authentication =async function (req , res , next) {
    try {
        let token = req.headers["x-api-key"];
        if(!token) token = req.headers["X-Api-Key"]
        
        if(!token) return res.status(401).send({status : false , message : "token require"});

        // let decodedToken = jwt.verify(token , "Product Management Project@#$%");
        // console.log(decodedToken);
        
        // if(!decodedToken) return res.status(401).send({
        //     status : false,
        //     message : "Invalid token  unauthenticated"
        // })
        jwt.verify(token, "Product Management Project@#$%", async(error, decoded) => {
            if (error) {
                return res.status(401).json({
                    status: false,
                    message: "Invalid Token Authentication failed"
                });
            }
            
            next();
        });


    } catch (error) {
        return res.status(500).send({status : false , message : error})
    }    
};



const authorise = function (req, res, next) {
   try {
      let token = req.headers["x-api-key"]
      let decodedToken = jwt.verify(token, "Product Management Project@#$%")

      //userId for which the request is made. 
      let userToBeModified = req.params.userId
      //userId for the logged-in user
      let userLoggedIn = decodedToken.userId

      //userId comparision to check if the logged-in user is requesting for their own data
      if (userToBeModified != userLoggedIn) return res.status(403).send({ status: false, msg: 'User logged is not allowed to modify the requested users data' })

      next()
   } catch (error) {
      res.status(500).send({ status: false, msg: error })
   }
}

module.exports.authentication = authentication;
module.exports.authorise = authorise;


// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDVkMWM0MmZiNzgwNzk0ZmRiMDFjOTIiLCJiYXRjaCI6InRlY2huZXRpdW0iLCJvcmdhbmlzYXRpb24iOiJGdW5jdGlvblVwIiwiaWF0IjoxNjgzOTAyMzI0fQ.kUOLhqlHq5eCDkKyzmJ0d6Hs-RvBKarfwW8j9-830Uo