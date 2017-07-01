$("#sign-in").click(function(){
  var twitterWindow=window.open("");
  $.post("/sign_in_request",function(res){
    if(res.error){
      alert(res.error);
      console.log(res.error);
    }else if(res.id){
      twitterWindow.close();
      window.location.reload(false);
    }else{
      $.post("/get_user",{tok:res},function(response){
        console.log("r");
        /*if(!response.user){
          alert("Error logging in.");
        }else if(response.error_fetching_user){
          alert(response.user.error_fetching_user);
        }else if(response.user){
          window.location.reload(false);
        }*/
      });
      twitterWindow.location.href="https://api.twitter.com/oauth/authenticate?oauth_token="+res;
      var clientSocket = new WebSocket('wss://book-trade.glitch.me/get_user');
      clientSocket.onopen=function(){
        clientSocket.send(res);
      }
      clientSocket.onmessage=function(msg){
        msg=msg.data;
        console.log(msg);
        if(msg=="signed in")
          window.location.reload(false);
        else if(msg=="error")
          alert("Error signing in, please try again.")
      }
    }
  });
});

$(".navbar-right").on("click","#sign-out",sign_out);

function sign_out(){
  $.post("/sign_out",function(res){
      window.location="/"; 
  });
}

$("#save").click(function(){
  var info={
    full_name:$("#full_name").val().trim(),
    city:$("#city").val().trim(),
    state:$("#state").val().trim(),
    country:$("#country").val().trim()
  };
  $.post("/save_settings",info,function(resp){
    if(resp.error){
      alert(resp.error);
    }else{
      $(".response").html("Settings saved.");
      $(".response").slideDown(300,"swing",function(){
        setTimeout(function(){$(".response").slideUp(300)},1500);
      });
    }
  });
});