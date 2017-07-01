var express = require('express'),
 expressws = require('express-ws')(express());
var ejs=require("ejs");
var app = expressws.app;
var mongodb=require('mongodb').MongoClient;
var session=require('express-session');

var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callback: 'https://book-trade.glitch.me/sign_in'
});
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.set('view engine', 'ejs');  
app.use(express.static('public'));
app.use(session({secret: process.env.SECRET}));

app.get("/", function (request, response) {
  var ip=request.headers["x-forwarded-for"].toString().split(",")[0];
  var user=request.session.user;
  response.render(__dirname + '/views/index.ejs',{user:user});
});

app.get("/your_trades",function(req,res){
  var user=req.session.user;
  if(user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      var cll=db.collection("book_trade");
      var requests=[];
      var requested=[];
      cll.findOne({user:user.id_str},function(err,doc){
        if(doc){
          if(doc.requests){
            doc.requests.forEach(e=>{
              if(e.status=="unapproved") requests.push(e);
            });
          }
        }
        cll.find({'requests.uid':user.id_str}).each(function(err,doc){
          if(doc){
            
            doc.requests.forEach(e=>{
              if(e.uid==user.id_str){
                if(e.status=="approved"){
                  var info="";

                  if(doc.full_name && doc.fullname!="") info+="<b>Full name :</b> "+doc.full_name+"<br>";
                  if(doc.city && doc.city!="") info+="<b>City :</b> "+doc.city+"<br>";
                  if(doc.state && doc.state!="") info+="<b>State :</b> "+doc.state+"<br>";
                  if(doc.country && doc.country!="") info+="<b>Country :</b> "+doc.country+"<br>";
                  if(e.msg && e.msg!="") info+="<b>Message :</b> "+e.msg+"<br>";
                  e.msg=info;
                }
                requested.push(e);
              } 
            });
          }else{
            res.render(__dirname+"/views/your_trades.ejs",{user:user,requests:requests,error:null,
                                                           requested:requested,
                                                           statuses:{unapproved:'default',approved:'success',rejected:'danger'}});
          }
        });
      });
    });
  }else{
    res.render(__dirname+"/views/your_trades.ejs",{user:null});
  }
});

app.get("/all_books",function(req,res){
  var user=req.session.user;
  if(user){
    var books=[]
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection("book_trade").find().each(function(err,doc){
        if(doc){
          var user_info="";
          user_info="";
          if(doc.city && doc.city!="") user_info+="<b>City :</b> "+doc.city+"<br>";
          if(doc.state && doc.state!="") user_info+="<b>State :</b> "+doc.state+"<br>";
          if(doc.country && doc.country!="") user_info+="<b>Country :</b> "+doc.country;
          if(user_info=="") user_info="No info.";
          doc.books.forEach(e=>{
            e.user_id=doc.user;
            e.user_info=user_info;
            books.push(e);
          });
        }else{
          res.render(__dirname+"/views/all_books.ejs",{user:user,books:books,error:null});
        }
      });
    });
  }else{
    res.render(__dirname+"/views/all_books.ejs",{user:null});
  }
});

app.get("/my_books",function(req,res){
  var user=req.session.user;
  if(user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection("book_trade").findOne({user:user.id_str},function(err,doc){
        if(doc){
          res.render(__dirname+"/views/my_books.ejs",{user:user,books:doc.books,error:null});
        }else{
          res.render(__dirname+"/views/my_books.ejs",{user:user,books:[],error:null});
        }
      })
    });
  }else{
    res.render(__dirname+"/views/my_books.ejs",{user:null});
  }
});

app.get("/settings",function(req,res){
  var user=req.session.user;
  console.log(user);
  if(user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection("book_trade").findOne({user:user.id_str},function(err,doc){
        var info={};
        console.log(doc);
        if(doc){
          info.full_name=doc.full_name;
          info.city=doc.city;
          info.state=doc.state;
          info.country=doc.country;
        }
        res.render(__dirname+"/views/settings.ejs",{user:user,info:info});
      });
    });
  }else{
    res.render(__dirname+"/views/settings.ejs",{user:null});
  }
});

app.post("/save_settings",function(req,res){
  var user=req.session.user;
  if(user){
    var info=req.body;
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection("book_trade").updateOne({user:user.id_str},{$set:{full_name:info.full_name,city:info.city,state:info.state,country:info.country}},{upsert:true},function(err,results){
        res.send(true);
      });
    });
  }else{
    res.send({error:"sign in"});
  }
});

app.post("/add_book",function(req,res){
  if(req.session.user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      var collctn=db.collection("book_trade");
      collctn.updateOne({user:req.session.user.id_str},{$addToSet:{books:req.body}},{upsert:true},function(err,result){
        res.send({mod:result.modifiedCount});
      });
    });
  }else{
    res.send({error:"Sign in."});
  }
});

app.post("/remove_book",function(req,res){
  if(req.session.user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection('book_trade').updateOne({user:req.session.user.id_str},{$pull:{books:{id:req.body.id}}},function(err,result){
        res.send(true);
      });
    });
  }else{
    res.send({error:"Sign in required."})
  }
});

app.post("/request_book",function(req,res){
  var user=req.session.user;
  if(user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      var cll=db.collection("book_trade");
      cll.findOne({user:req.body.uid,'books.id':req.body.bookid},function(err,doc){
        if(doc){
          if(doc.requests)
            var addreq=doc.requests.every(e=>{
              return !(e.uid==user.id_str && e.bookid==req.body.bookid);
            });
          else
            addreq=true;
          
          var title="";
          doc.books.forEach(function(e){
            if(e.id==req.body.bookid) title=e.title;
          });
          if(addreq)
            cll.updateOne({user:req.body.uid},{$addToSet:{requests:{uid:user.id_str,bookid:req.body.bookid,title:title,status:"unapproved"}}},{upsert:true},function(err,results){
              res.send({status:"Requested : "+title});
            });
          else
            res.send({status:"Already requested"})
        }else{
          res.send({error:"no user having book"})
        }
      });
    });
  }else{
    res.send({error:"error"});
  }
});

app.post("/remove_request",function(req,res){
  var user=req.session.user;
  if(user){
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection("book_trade").updateOne({'requests.uid':user.id_str,'requests.bookid':req.body.bookid},{$pull:{requests:{uid:user.id_str,bookid:req.body.bookid}}},function(err,results){
        console.log(err);
        res.send(true);
      });
    });
  }
});

app.post("/answer_request",function(req,resp){
  var user=req.session.user;
  if(user){
    var ans=req.body;
    console.log(ans);
    mongodb.connect(process.env.DB_URL,function(err,db){
      db.collection("book_trade").updateOne({user:user.id_str,requests:{$elemMatch:{'bookid':ans.bookid,'uid':ans.uid}}},
                                            {$set:{'requests.$.status':(ans.ans=="ac")?("approved"):("rejected"),'requests.$.msg':ans.msg}},function(err,result){
        resp.send(true);
      });
    });
  }else{
    resp.send({error:"Sign in"});
  }
});

var loggedin={};
var reqs={};
app.post("/sign_in_request",function(req,response){
  var ip=req.headers["x-forwarded-for"].toString().split(",")[0];
  if(loggedin[ip]){
    response.send(loggedin[ip]);
  }else{
    twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
        if (error) {
          response.send({"error":error})
        } else {
          reqs[requestToken]={secret:requestTokenSecret,response:response};
          response.send(requestToken);
        }
    });
  }
});

app.get("/sign_in",function(request,response){
  var requestToken = request.query.oauth_token,
  verifier = request.query.oauth_verifier;
  if(requestToken){
    var secret=reqs[requestToken].secret;
    var ws=reqs[requestToken].ws;
    var reqq=reqs[requestToken].request;
    var res=reqs[requestToken].response;
    twitter.getAccessToken(requestToken, secret, verifier, function(err, accessToken, accessSecret) {
      if (err){
        response.send("<html><body>"+err+"</body></html>");
        ws.send("error");
      }else{
        response.send("<html><body><script language='javascript'>window.close();</script></body></html>");
        twitter.verifyCredentials(accessToken, accessSecret, function(err, user) {
            if (err){
              ws.send("error");
            }else{
              reqq.session.user=user;
              res.send("s");
              ws.send("signed in");
              loggedin[reqq.headers["x-forwarded-for"].toString().split(",")[0]]=user;
            }
        });
      }
    });
  }
});

app.post("/get_user",function(request,response){
  reqs[request.body.tok].response=response;
  reqs[request.body.tok].request=request;
});

app.ws("/get_user",function(ws,res){
  ws.on('message', function(tok) {
    reqs[tok].ws=ws;
  });
});

app.post("/sign_out",function(req,res){
  var ip=req.headers["x-forwarded-for"].toString().split(",")[0];
  var sessionv=req.session;
  sessionv.user=null;
  req.session.destroy();
  req.session=sessionv;
  delete loggedin[ip];
  res.send(true);
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});