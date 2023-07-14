//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash")
const date = require(__dirname + "/date.js");

const app = express();


app.set('view engine', 'ejs');



app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');


//MONGOOSE MODEL FOR HOME PAGE
const itemsSchema = new mongoose.Schema({
  name:String
});

const Item = mongoose.model("item", itemsSchema); 
    //when using mongoose model should use variable in caps
const item1 = new Item({
  name:"Wake up"
});
const item2 = new Item({
  name:"Light exercise"
});
const item3 = new Item({
  name:"Have breakfast"
});
const defaultItems=[item1, item2, item3];


//MONGOOSE MODEL FOR CUSTOM LIST
const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model("list", listSchema); 



app.get("/", function(req, res) {

const day = date.getDate();

Item.find({}).then(function(foundItems){
  if(foundItems.length===0){
    Item.insertMany(defaultItems) .then(function () {
      console.log("Successfully saved defult items to DB");
    })
    .catch(function (err) {
      console.log(err);
    });
    res.redirect("/"); //this will redirect to app.get("/"), then the list wont be empty
  }
  else{
  res.render("list", {listTitle:day, newListItems: foundItems});
}

});

});


app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req,res){
  const customListName =_.capitalize( req.params.customListName);
 
  List.findOne({name:customListName}).then(function(foundList){
    
      if(!foundList){
        const list= new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
       
        res.redirect("/"+customListName);
        
      }
      else{
        
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});  
      }
    
  });
  
});





app.post("/", function(req, res){

  const Newitem = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();
  const newitem = new Item({
    name:Newitem
  })

  if(listName===day){
  newitem.save();
  res.redirect("/");
  }
  else{
    List.findOne({name:listName}).then(function(foundList){
      foundList.items.push(newitem);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});


app.post("/delete", function(req,res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();
  if(listName=== day){
  Item.findByIdAndRemove(checkItemId).then(function(err){
    if(!err){
      console.log("successful");
      
    }
  });
  res.redirect("/")
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkItemId}}}).then(function(err){
      if (!err){
        console.log("successful");
        
      }
    });
    res.redirect("/"+listName)
  }

});






app.listen(3000, function() {
  console.log("Server started on port 3000");
});
