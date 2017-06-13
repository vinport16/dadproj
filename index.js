var bodyparser = require('body-parser');
var express = require('express');
var sio = require('socket.io');
var YAML = require('yamljs');
var fs = require('fs');
var pg = require('pg');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 8080; //runs on heroku or localhost:8080

var pw = "password";

//listen for port
http.listen(port);

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432';

const client = new pg.Client(connectionString);
client.connect();

pg.connect(connectionString, function(err, client, done) {
  client.query('CREATE TABLE IF NOT EXISTS data(id SERIAL PRIMARY KEY, date VARCHAR(60) not null, box0 INT, box1 INT, box2 INT, box3 INT, box4 INT, box5 INT, box6 INT, box7 INT, box8 INT, total INT, color VARCHAR(10))', function(err, result) {
    done();
  });
});


app.get('/db', function (request, response) {
  pg.connect(connectionString, function(err, client, done) {
    client.query('SELECT * FROM data', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.send( result.rows ); }
    });
  });
});

app.use(bodyparser.urlencoded({  //for reading forms
	extended: true
}));
app.use(bodyparser.json());


app.get('/', function(req, res){ //when someone connects initially, send the index
	res.sendFile(__dirname + '/index.html');
});


app.post('/adder', function(req, res){
	if(req.body.pass == pw){  //check password
		res.sendFile(__dirname + '/adder.html');
	}else{
		res.send("incorrect password");
	}
});


app.post('/data', function(req, res){  //construct data table HTML
	if(req.body.pass == pw){  //check password again

		var html = "";

		get_db(function(content){
			fs.readFile("data_top.html", 'utf8', function(err, filetext){
				if (err) throw err;
				html+=filetext;

				html += "<tr>";
				for(var i = content.length-1; i >= 0; i--){
					html += "<th class='rotate'><div style='color:"+content[i].color+"'><span>"+content[i].date+"</span></div></th>";
				}
				html += "</tr><tr>";

				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box0+"</td>";
				}
				html += "</tr><tr>";

				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box1+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box2+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box3+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box4+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box5+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box6+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box7+"</td>";
				}
				html += "</tr><tr>";
				
				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].box8+"</td>";
				}
				html += "</tr><tr>";

				for(var i = content.length-1; i >= 0; i--){
					html += "<td>"+content[i].total+"</td>";
				}
				html += "</tr><tr>";
				
				



				fs.readFile("data_bottom.html", 'utf8', function(err, filetext){
					if (err) throw err;
					html+=filetext;
					res.send(html);
				});

			});
		});

	}else{
		res.send("incorrect password");
	}
});

io.on("connection", function(socket){ //Save data entry to db

	socket.on("saveLog", function(data){

		if(data.code  == null){
			console.log("can't log null code data");
		}else{
			add_to_db(data);
		}

	});

	socket.on("census",function(){
		get_db(function(content){
			if(content[0] != undefined){
				if(Date().substring(0,10) === content[content.length-1].date.substring(0,10)){
					socket.emit("census",content[content.length-1].box0);
				}
			}
		});

	});

	app.post('/download', function(req, res){  // download .csv file of data
		console.log(req.body.pass);
		if(req.body.pass == pw){  //check password again
			var name = "generated.csv";

			var text =
			"date, "+
			"AM hospital census, "+
			"arrivals in three hours, "+
			"pt arrivals by 1pm, "+
			"admissions without assigned beds, "+
			"ICU beds (not including CTIC or ICCU*), "+
			"people waiting (ambulance & public), "+
			"longest wait (hours) (ambulance or public), "+
			"ESI 2 not bedded*, "+
			"critical care patients*, "+
			"code, "+
			"color,\n";

			get_db(function(content){
				if(content == null){
					content = [];
				}

				for(var i = content.length-1; i >= 0; i--){
					text += content[i].date+", "+
					content[i].box0+", "+
					content[i].box1+", "+
					content[i].box2+", "+
					content[i].box3+", "+
					content[i].box4+", "+
					content[i].box5+", "+
					content[i].box6+", "+
					content[i].box7+", "+
					content[i].box8+", "+
					content[i].total+", "+
					content[i].color+", \n";
				}

				fs.writeFile ("generated.csv", text, function(err) { //write data back into file
					if (err) throw err;
					var file = __dirname + '/generated.csv';
					res.download(file);			// here's where the download happens
				});
			});

			
		}
		
	});

});

add_to_db = function(data){
  pg.connect(connectionString, function(err, client, done) {
    client.query("INSERT INTO data (date, box0, box1, box2, box3, box4, box5, box6, box7, box8, total, color) VALUES ('"+data.date+"', "+
    	data.box0+", "+
    	data.box1+", "+
    	data.box2+", "+
    	data.box3+", "+
    	data.box4+", "+
    	data.box5+", "+
    	data.box6+", "+
    	data.box7+", "+
    	data.box8+", "+
    	data.code.total+", '"+
    	data.code.color+"')"   , function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
    });
  });
}

function get_db(callback){
	pg.connect(connectionString, function(err, client, done) {
    client.query('SELECT * FROM data', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else{
      	callback(result.rows);
      }
    });
  });
}
