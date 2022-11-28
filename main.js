var redis = require('redis');
var multer  = require('multer');
var express = require('express');
var fs      = require('fs');

var measure = require('measure');
var collectTime = measure.measure('timer1');

var app = express();
// REDIS
var client = redis.createClient(6379, '139.140.110.233', {})


// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	client.lpush("requests", req.url);
	console.log(req.method, req.url);

	next(); // Passing the request to the next handler in the stack.
});


app.get('/', function(req, res) {
  res.send('hello world');
});

app.get("/get", function(req, res){
	const ip = req.connection.remoteAddress;
	const key = ip+"_key";
	client.get(key,function(err,result){
		if(err){
			console.log(err);
		}
		else{
			res.send(result);
		}
	});
});

function get_line(filename, line_no, callback) {
    var data = fs.readFileSync(filename, 'utf8');
    var lines = data.split("\n");

    if(+line_no > lines.length){
      throw new Error('File end reached without finding line');
    }

    callback(null, lines[+line_no]);
}

app.get("/catfact/:num", function(req, res){
	const ip = req.connection.remoteAddress;
	const key = ip+"_cache";
	var line = req.params.num;
	var nil = ip+"_catfact:" + line;
	var start = collectTime();
	client.get(nil,function(err,result){

		client.get(key, function(err2, result2){

		console.log("Cache status" + result2);
			if(result!=null && result2==1){
				console.log("Hit!")
				client.set(nil,result,"EX",10);
				var end = collectTime()
				var time = end - start;
				console.log(start + " ===> " + end);
				res.send("Found: " + result + " in " + time);
			}
			else{
				console.log("Miss!")
				
				// simulate this being slower :)
				sleepFor(500);
				
				var fact = get_line("catfacts.txt", line, function(a,b){
					client.set(nil,b,"EX",10);

					var end = collectTime()
					var time = end - start;
					//console.log(start + " ===> " + end);
					res.send("Found: " + b + " in " + time);

				});
			}
	  });

	});


});


app.get("/cacheStatus/toggle", function(req, res){
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	
	const key = ip+"_cache";
	
	
	client.get(key, function(err, result){

		var oldResult = result;

		if(null==result){
			result = 1;
		}
		else{
			result ^= 1;
		}

		client.set(key,result);
		res.send("Changing from " + oldResult + " to " + result);

	});
});

app.get("/cacheStatus", function(req, res){
	const ip = req.connection.remoteAddress;
	const key = ip+"_cache";
		
	client.get(key, function(err, result){
		res.send(result);
	});
});

app.get("/set", function(req, res){
	const ip = req.connection.remoteAddress;
	const key = ip+"_key";	
	client.set(key,"this message will self-destruct in 10 seconds","EX",10);
	client.get(key,function(err,result){
		if(err){
			console.log(err);
		}
		else{
			res.send(result);
		}
	});

});

app.get("/recent", function(req, res){
	const ip = req.connection.remoteAddress;
	
	client.lrange(ip+"_requests",0, 4,function(err,result){
		if(err){
			console.log(err);
		}
		else{
			res.send(result);
		}
	});

});

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
    console.log(req.body) // form fields
    console.log(req.files) // form files

    if( req.files.image )    {
 	   fs.readFile( req.files.image.path, function (err, data) {
 	  		if (err) throw err;
 	  		var img = new Buffer(data).toString('base64');
			  client.rpush("cats", img);
 	  		console.log(img);
 		});
 	}

    res.status(204).end()
 }]);

app.get('/meow', function(req, res){
	{
 		//if (err) throw err
 		res.writeHead(200, {'content-type':'text/html'});
		client.rpop("cats", function(err, success){
			res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+success+"'/>");
			res.end();
		});
	}
})

app.get('/test', function(req, res) {
	{
		res.writeHead(200, {'content-type':'text/html'});
		res.write("<h3>test</h3>");
   		res.end();
	}
})

function sleepFor(sleepDuration){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* Do nothing */ }
}

// HTTP SERVER
var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})

exports
