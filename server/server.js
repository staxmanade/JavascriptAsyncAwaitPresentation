let express = require( 'express' );
let app = express();
let bodyParser = require('body-parser');

app.use(require('cors')());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())

// data
let mrRobot = require('./mr-robot.json');
let mrRobotShow = mrRobot;
let mrRobotEpisodes = mrRobot._embedded.episodes;
delete mrRobotShow._embedded;
mrRobot.episodes = mrRobotEpisodes.map(x => {
    return x.id
});
// static home page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// api
app.get('/api/shows/mr-robot', function( req, res ) {
    res.json(mrRobot);
});

app.get('/api/shows/mr-robot/episode/:episodeId', function( req, res ) {
    let episode = mrRobotEpisodes.filter(x => x.id == req.params.episodeId)[0];

    if (true) {
        res.json(episode);
    } else {
        setTimeout(() => {
            res.json(episode);
        }, Math.random() * 300);
    }

});

app.get('/api/shows/mr-robot/episodes', function( req, res ) {
    res.json(mrRobotEpisodes);
});

// start the server
app.listen(3000, function () {
  console.log('test app listening on port 3000!')
});
