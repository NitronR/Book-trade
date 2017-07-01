$(".oinfo").click(function(){
  $("#oinfo_modal .modal-body").html($(this).attr("oinfo"));
  $("#oinfo_modal").modal();
})

$(".request").click(function(){
  var uid=$(this).attr("uid");
  var bookid=$(this).attr("bookid");
  
  $.post("/request_book",{uid:uid,bookid:bookid},function(res){
    if(res.error){
      alert(res.error);
    }else{
      $(".response").html(res.status);
      $(".response").slideDown(300,"swing",function(){
        setTimeout(function(){$(".response").slideUp(300)},1500);
      });
    }
  });
});