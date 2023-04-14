//requiring all the packages

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");











//initialising express and setting the view enjine.
const app = express();
app.use(express.static("public"));
app.use (express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(session({
  secret:"Rocketcodesisawesome",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());







//connecting to mongodb
mongoose.connect("mongodb+srv://admin-rocketcodes:mzmschool@cluster1.v0l1hp9.mongodb.net/nftmarketplaceDB");






//creating nftSchema
const nftSchema = mongoose.Schema({
  price:String,
  url:String,
  name:String
});







//creating using userSchema
const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  name:String,
  role:{type:String,required:true,default:"User"},
  nfts:[nftSchema],
  cart:[nftSchema]
});






//adding plugin to mongoose
userSchema.plugin(passportLocalMongoose);







//creating mongoose model
const Nft = mongoose.model("Nft",nftSchema);
const User = mongoose.model("User",userSchema);




passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());







//get route for HomePage
app.get("/",function(req,res){
  res.render("home");
});











//get Route for all listed nft page
app.get("/nfts",function(req,res){
let cartitem = [];
  if(req.isAuthenticated()){

    User.findOne({_id:req.user._id},function(err,foundUser){
      if(!err){
        cartitem = foundUser.cart;

            Nft.find({},function(err,nfts){
              if(!err){
                res.render("nfts",{nfts:nfts,cartitem:cartitem});
              }
            });
      }

    });


  }





  else{
    Nft.find({},function(err,nfts){
      if(!err){
        res.render("nfts",{nfts:nfts,cartitem:cartitem});
      }
    });
  }




});











//get route for login page
app.get("/login",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("/nfts");
  }
  else{
    res.render("login");
  }

});










//get route for register page
app.get("/register",function(req,res){
  res.render("register");
});











//get route for cart page
app.get("/cart",function(req,res){
  if(req.isAuthenticated()){
    User.findOne({_id:req.user._id},function(err,foundUser){
      if(!err){
        res.render("cart",{nfts:foundUser.cart})
      }

    });
  }
  else{
    res.redirect("/login");
  }

});
















//get route for user's bought nft page
app.get("/mynfts",function(req,res){

  if(req.isAuthenticated()){
    User.findOne({_id:req.user._id},function(err,foundUser){
      if(!err){
        res.render("mynfts",{nfts:foundUser.nfts})
      }

    });
  }
  else{
    res.redirect("/login");
  }

});














//post route for adding nfts to users cart
app.post("/addtocart",function(req,res){



  if(req.isAuthenticated()){
    const nfturl = req.body.nfturl;
    const nftname = req.body.nftname;
    const nftprice = req.body.nftprice;
    const nftid = req.body.nftid;
       const user = req.user.name;
       const nft = new Nft ({
         _id:nftid,
        price:nftprice,
        url:nfturl,
        name:nftname

     });

     //if item already exist then pull from the cart.
     User.findOneAndUpdate({_id:req.user._id},{$pull:{cart:{_id:nftid}}},function(err,foundUser){
       if(!err){
         User.findOne({_id:req.user._id},function(err,foundUser){
           if(!err){
             foundUser.cart.push(nft);
             foundUser.save();
             res.redirect("/nfts");
           }

         });
       }
     });




    }
    else{
      res.redirect("/login");
    }




});














//post route for buying nfts
app.post("/buynft",function(req,res){


    if(req.isAuthenticated()){
      const nfturl = req.body.nfturl;
      const nftname = req.body.nftname;
      const nftprice = req.body.nftprice;
      const nftid = req.body.nftid;
         const user = req.user.name;
         const nft = new Nft ({
           _id:nftid,
          price:nftprice,
          url:nfturl,
          name:nftname

       });
         User.findOne({_id:req.user._id},function(err,foundUser){
           if(!err){
             foundUser.nfts.push(nft);
             foundUser.save();

    Nft.findByIdAndRemove({_id:nftid},function(err){
    if(!err){
      User.findOneAndUpdate({_id:req.user._id},{$pull:{cart:{_id:nftid}}},function(err,foundUser){
        if(!err){
          res.redirect("/mynfts");
        }
      });
    }
  });


           }

         });


      }
      else{
        res.redirect("/login");
      }

});


















//post route for adding new nfts ( for admin)
app.post("/addnewnft",function(req,res){
  const nft = new Nft({
    name:req.body.name,
    url:req.body.url,
    price:req.body.price

 });

 nft.save();
 res.redirect("/nfts");

});















// post route for register page
app.post("/register",function(req,res){
  const userName = req.body.username;
  const passWord = req.body.password;
  const name = req.body.name;

User.register({username:userName,name:name},passWord,function(err,user){
  if(err){
    console.log(err);
    res.redirect("/register");
  }

  else{
    passport.authenticate("local")(req,res,function(){
        res.redirect("/nfts");

    });
  }
});

});












//post route from login page
app.post("/login",function(req,res){
  const userName = req.body.username;
  const passWord = req.body.password;

const user = new User({
  username:userName,
  password:passWord
});


try{
  req.login(user, function(err){
    if(err){
      console.log(err);
    }

    else{
        passport.authenticate("local")(req,res,function(){
        res.redirect("/nfts");
      });
    }
  });
}catch(err){
  console.log(err);
}

});











// get route for admin page ( for uploading nfts)
app.get("/admin",function(req,res){
  res.render("admin");
});










//for logging out
app.get("/logout",function(req,res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
});






//node server
app.listen(process.env.PORT||3000,function(){
  console.log("Server has been started..........");
});
