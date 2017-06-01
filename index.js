var bodyparser = require('body-parser');
var express = require('express');
var sio = require('socket.io');
var YAML = require('yamljs');
var fs = require('fs');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 8080; //runs on heroku or localhost:8080

var pw = "password";
//listen for port
http.listen(port);

var file = "db.txt";
app.use(bodyparser.urlencoded({  //for reading forms
  extended: true
}));
app.use(bodyparser.json());

fs.stat(file, function(err, stat) {
    if(err == null) {
        console.log('db.txt exists');
    } else if(err.code == 'ENOENT') {
        // file does not exist
        fs.writeFile(file, "");
    } else {
        console.log('Some other error: ', err.code);
    }
});

app.get('/', function(req, res){ //when someone connects initially, send the index
	res.sendFile(__dirname + '/index.html');
});

app.post('/adder', function(req, res){
	if(req.body.pass == pw){
		res.sendFile(__dirname + '/adder.html');
	}else{
		res.send("incorrect password");
	}
});

app.post('/data', function(req, res){
	if(req.body.pass = pw){

		var html = "";

		fs.readFile(file, 'utf8', function (err, filedata) {
            if (err) throw err;
            var content = YAML.parse(filedata);

            if(content == null){
            	content = [];
            }
            html += "<table>";
            for(var i = 0; i < content.length; i++){
            	html += "<tr> <td> <font color="+content[i].code.color+">"+content[i].code.color+"</font></td><td><font color='"+content[i].code.color+"'>"+content[i].date+"</font></td> </tr>";
            }
            
            html += "</table>";

            html = "<html><head><title>Data</title></head><body bgcolor=\"BBBBBB\">" + html + "</body></html>";

            res.send(html);
        });

	}else{
		res.send("incorrect password");
	}
});

io.on("connection", function(socket){
	socket.on("saveLog", function(data){
		data.date = Date();

		fs.readFile(file, 'utf8', function (err, filedata) {
            if (err) throw err;
            var content = YAML.parse(filedata);

            if(content == null){
            	content = [];
            }

            if(data.code  == null){
  				console.log("can't log null code data");
            }else{
            	content.push(data);

           		filedata = YAML.stringify(content, 2);

            	fs.writeFile (file, filedata, function(err) {
                	if (err) throw err;
                	console.log('data written to file '+data.date);
            	});
            }
            
        });

	});
});
