$(".rm").click(function(){
  var b=$(this).parent();
  var bookid=$(this).attr("bookid");
  $.post("/remove_request",{bookid:bookid},function(res){
    if(res.error){
      alert(res.error);
    }else{
      b.remove();
      if($(".rm").length==0){
        $("#reqd").html("You requested no books.");
      }
    }
  });
});

$(".rj").click(function(){
  var b=$(this).parent();
  answer("rj",b);
});

$(".ac").click(function(){
  ac=$(this).parent();
  $("#accept_modal").modal();
});

var ac;
$("#accept").click(function(){
  answer("ac",ac,$("#msg").val());
  $("#msg").val("");
});

function answer(ans,b,msg){
  var uid=b.attr("uid");
  var bookid=b.attr("bookid");
  $.post("/answer_request",{ans:ans,uid:uid,bookid:bookid,msg:msg},function(res){
    if(res.error){
      alert(res.error);
    }else if(res){
      b.remove();
      if($(".rj,.ac").length==0){
        $("#req").html("There are no requests for you.");
      }
    }
  });
}

$(".label-info").click(function(){
  var info=$(this).attr("data");
  $("#display_modal .modal-body").html(info);
  $("#display_modal").modal();
});