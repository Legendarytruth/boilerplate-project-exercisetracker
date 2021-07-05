require('dotenv').config();
mongoose = require("mongoose");
const express = require('express')
const app = express()
const cors = require('cors')
//const Database = require("@replit/database")
//const db = new Database()
const bodyParser = require("body-parser");


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, unique: true, required: true },
});

const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String},
  other_date: { type: Date, default: Date.now },
},{ versionKey: false });

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

function createId(){
  const a = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

}

async function createUser(name){
  let test = await User.findOne({username: name})
  if(test){
    return "error"
  }else{
    let u = new User({username: name});
    return u.save()
  }
}

async function createExercise(ids, desc, dur, dat){
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var months = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
  //console.log(ids +" / "+ desc +" / "+ dur +" / "+ dat)
  let test = await User.findById(ids);
  if(!test){
    return "error"
  }else{
    if(dat == undefined){
      var now = new Date();
      var day = days[now.getDay()];
      var month = months[now.getMonth()];
      var date = parseInt(now.getDate()) < 10 ? "0"+now.getDate() : now.getDate();
      //console.log(date)
      var t = day +" "+ month+ " "+ date + " " + now.getFullYear()
      let e = new Exercise({username: test.username, description:desc, duration: dur, user_id: ids,date: t, other_date: now})
      return e.save()
    }else{
      var now = new Date(dat)
      var day = days[now.getDay()];
      var month = months[now.getMonth()];
      var date = parseInt(now.getDate()) < 10 ? "0"+now.getDate() : now.getDate();
      var t = day +" "+ month+ " "+ date + " " + now.getFullYear()
      let e = new Exercise({username: test.username, description:desc, duration: dur, user_id: ids,date: t, other_date: now})
      return e.save()

    }
  }
}

app.post("/api/users", async function(req, res){
  let u = await createUser(req.body.username)
  if(u == "error"){
    res.json({error: "User already exists"})
  }else{
    //console.log(u)
    res.json(u)
  }
})

app.get("/api/users", async function(req, res){
  let u = await User.find();
  if(u){
    res.json(u)
  }else{
    res.json({error: "error"})
  }
})

app.post("/api/users/:_id/exercises", async function(req, res){
  //console.log(req.params._id+" / "+req.body.description+" / "+req.body.duration+" / "+req.body.date)
  let e = await createExercise(req.params._id, req.body.description, req.body.duration, req.body.date)
  if(e == "error"){
    res.json({error: "Unknown userId"})
  }else{
    var s = {"_id": req.params._id, "username": e.username, "date": e.date, "duration": e.duration , "description":e.description}
    //console.log(s)
    //{username: e.username, description: e.description, duration: e.duration, _id: e.user_id, date: e.date}
    //console.log(s)
    res.json(s)
  }
})

app.get('/api/users/:_id/logs', (req, res) =>{
  let filter_date = {};
  console.log(req.query.to +" / " + req.query.from +" / " + req.query.limit + " / "+ req.params._id)
  if(req.query.from){
    filter_date["$gte"] = new Date(req.query.from);
  }
  if(req.query.to){
    filter_date["$lte"] = new Date(req.query.to);
  }
  User.findById(req.params._id).then((u) =>{ 
  let u_obj = u.toObject();
  let exer = {};
  if(!(Object.keys(filter_date).length === 0 && filter_date.constructor === Object)){
    //console.log(filter_date)
    exer = Exercise.find({
    user_id: req.params._id, other_date: filter_date
  });
  }else{
      exer = Exercise.find({
    user_id: req.params._id,
  });
  }
  //exer.exec((err, e) => console.log(e))
  if(req.query.limit){
    exer = exer.limit(parseInt(req.query.limit));
  }
  exer.exec((error, e) => {
        if (error) {
          res.json({ error: error });
        } else {
          u_obj.count = e.length;
          u_obj.log = e;
          //console.log(u_obj)
          res.json(u_obj)
}})    
})
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
