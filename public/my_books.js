$("input").keyup(function(event){
  if(event.keyCode==13){
    $("#add").click();
  }
});

$("#add").click(function(){
  var name=$("#title").val().trim();
  var aname=$("#author_name").val().trim();
  
  if(name!=""){
    var q=name;
    if(aname!="") q+=" by "+aname;
    $("svg").addClass("trans");
    $("#loader").css("display","block");
    $.get("https://www.googleapis.com/books/v1/volumes?q="+q,function(data){
      if(data.items){
        var book={id:data.items[0].id};
        data=data.items[0].volumeInfo
        book.title=data.title;
        if(data.authors)
          book.authors=data.authors.toString();
        else
          book.authors="No info."
        if(data.imageLinks)
        book.img=data.imageLinks.smallThumbnail;
        else
          book.img=""
        $.post("/add_book",{id:book.id,title:book.title,authors:book.authors,img:book.img},function(resp){
          $("#loader").css("display","none");
          $("svg").removeClass("trans");
          if(resp.error){
            alert(resp.error);
          }else{
            if(resp.mod!=0){
              $("#no_books").remove();
              $("#my_books").append(`<div class="book">
            <img src="`+book.img+`"/>
            <div class="details">
              <div style="padding:10px;"><b>Title</b> : `+book.title+`
              <br><b>Author(s)</b> : `+book.authors+`</div>
              <div class="remove" data="`+book.id+`">
                Remove
              </div>
            </div>
          </div>`);
            }
          }
        });
      }else{
        $("#loader").css("display","none");
        $("svg").removeClass("trans");
        alert("No books found.")
      }
    });
  }else{
    alert("Book name is required.")
  }
})

$(document).on("click",".remove",function(){
  var p=$(this);
  $.post("/remove_book",{id:p.attr("data")},function(res){
    if(res.error){
      alert(res.error);
    }else{
      p.parent().parent().remove();
      if($("#my_books .book").length==0){
        $("#my_books").append("<span id='no_books'>No books added by you.</span>")
      }
    }
  });
});

