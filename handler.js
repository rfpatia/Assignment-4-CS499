var elasticsearch = require('elasticsearch');
var express = require('express');
var request = require('request');
var parseString = require('xml2js').parseString;
var fs = require('fs');

var client = new elasticsearch.Client({
  host: 'search-assignment4-6zqcipylqcwy3ntt6l4spes4ha.us-west-1.es.amazonaws.com',
  log: 'info'
});

client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 5000
}, function (error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

function loadDataSet() {
  fs.readFile("dataset/data.json", {encoding: 'utf-8'}, function(err,data) {
    if (!err) {      
      var items = JSON.parse(data);
      for(var i = 0; i < 1000; i++) {
        console.log(items[i]);
      }
    } else{
        console.log(err);
    }
  });
}

var minutes = 10, the_interval = minutes * 60 * 10;
setInterval(function() {
    console.log("I am doing my 5 minutes check");
    request('http://www.universalstudioshollywood.com/waittimes/?type=all&site=USH', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            parseString(body, function (err, result) {
                var items = result.rss.channel[0].item;
                for(var i = 0; i < items.length; i++) {
                    console.log(items[i]);
                    client.create({
                      index: 'universalstudio-rides',
                      type: 'ride',
                        id : items[i].title[0],
                        body: items[i]
                    }, function (error, response) {
                        console.log("put item successfully.")
                    })
                }
            });
        }
    })
}, the_interval);

function searchTest(searchterm, callback) {
  client.search({
    index: 'universalstudio-rides',
    body: {
      "query": {
        "bool": {
          "must": {
            "match": {
              "description": searchterm
            }
          }
        }
      }
    }
  }, function (error, response) {
    console.log(response);
    if (callback) {
      callback(response);
    }
  });
}

var app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/search', function (req, res) {
  searchTest(req.query.q, function(result) {
    res.send(result);
  });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

