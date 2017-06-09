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
	if(req.body.pass == pw){  //check password
		res.sendFile(__dirname + '/adder.html');
	}else{
		res.send("incorrect password");
	}
});


app.post('/data', function(req, res){  //construct data table HTML
	if(req.body.pass == pw){  //check password again

		var html = "";

		fs.readFile(file, 'utf8', function (err, filedata) {
			if (err) throw err;
			var content = YAML.parse(filedata);

			if(content == null){
				content = [];
			}

			fs.readFile("data_top.html", 'utf8', function(err, filetext){
				if (err) throw err;
				html+=filetext;

				html += "<tr>";
				for(var i = content.length-1; i >= 0; i--){
					html += "<th class='rotate'><div style='color:"+content[i].code.color+"'><span>"+content[i].date+"</span></div></th>";
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
					html += "<td>"+content[i].code.total+"</td>";
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

io.on("connection", function(socket){ //Save data entry to file

	socket.on("saveLog", function(data){

		fs.readFile(file, 'utf8', function (err, filedata) { //read YAML file
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

				fs.writeFile (file, filedata, function(err) { //write data back into file
					if (err) throw err;
					console.log('data written to file '+data.date);
				});
			}

		});

	});

	socket.on("census",function(){
		fs.readFile(file, 'utf8', function (err, filedata) { //read YAML file
			if (err) throw err;
			var content = YAML.parse(filedata);

			if(content != null){
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

			fs.readFile(file, 'utf8', function (err, filedata) { //read YAML file
				if (err) throw err;
				var content = YAML.parse(filedata);

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
					content[i].code.total+", "+
					content[i].code.color+", \n";
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
