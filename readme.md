# Today's assumptions

Somewhat familiar with ES6 syntax

- arrow functions `() => 'wat'`
- string interpolation
- Promise

If you're confused on some syntax stop
me and let's quickly review.


# Talk setup

Start sample nodejs server
```
cd server
npm start
```

Open [jsbin](http://jsbin.com)

Copy [index.html](server/public/index.html) into the `html` tab in jsbin.


## What is async/await

Really just syntactic sugar around existing constructs (Callback, Promise, Generators).




# Quick peek

```javascript
async function f1() {
  var someResult = await somethingThatReturnsAPromise();
  console.log(someResult);
  return someResult;
}

f1().then(someResult => {
    // do something with result
});
```










## Make Up Task Requiring Asyncronous Operation

Pseudocode

- Get show data inital data from url
    EX: `http://localhost:3000/api/shows/mr-robot`
- Turn response into JSON
- Get each episode by id: (separate web request)
    EX: `http://localhost:3000/api/shows/mr-robot/episode/{episodeId}`
  - Turn response into JSON
  - Add it to the show's episodes list
- Render out results to screen











## Helper to render a Show

```javascript
const mrRobotShowUrl = 'http://localhost:3000/api/shows/mr-robot';
const mrRobotEpisodeUrl = 'http://localhost:3000/api/shows/mr-robot/episode';

function printDataToScreen(show) {
  console.log('trace printDataToScreen');

  // set the html for display
  document.body.innerHTML = `<h1>${show.name}</h1>
   <ul>
      ${show.episodes.map(episode => `
            <li>
                <img src="${episode.image && episode.image.medium}" />
                <h3>Season ${episode.season}, Episode ${episode.number}</h3>
                ${episode.summary}
            </li>
        `).join('')}
    </ul>`;
}

```











## Callbacks

```javascript
console.log('trace 1');

function getMrRobotWithCallback(callback) {

  var requestJSON = function(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var data = JSON.parse(this.responseText);
        callback(data);
      }
    };
    xmlhttp.onerror = function() {
        console.error('TODO: handle error');
    }
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
  }

  requestJSON(mrRobotShowUrl, show => {

    function checkIfWereDone() {
        let keys = Object.keys(showEpisodes);
        let episodes = keys.map(key => showEpisodes[key])
                           .filter(x => x.value !== null)
                           .map(e => e.value);

        // wait for all async operations to complete
        // NOTE: this isn't full-proof - assumes happy-path (no errors)
        if (episodes.length === keys.length) {
          show.episodes = episodes;
          callback(show);
        }
    }

    var showEpisodes = {};
    show.episodes.forEach(episodeId => {
      showEpisodes[episodeId] = {
        episodeId: episodeId,
        value: null
      };

      let episodeUrl = mrRobotEpisodeUrl + "/" + episodeId
      requestJSON(episodeUrl, (result) => {
          showEpisodes[episodeId].value = result;
          showEpisodes[episodeId].done = true;
          checkIfWereDone();
      });
    });
  });
}

console.log('trace 2');

getMrRobotWithCallback(printDataToScreen);

console.log('trace 3');
```







## Promises

```javascript
function getMrRobotWithPromise() {

  return fetch(mrRobotShowUrl)
    .then(response => response.json())
    .then(show => {

        let episodePromises = show.episodes.map(episodeId => {
          let episodeUrl = mrRobotEpisodeUrl + "/" + episodeId
          return fetch(episodeUrl).then(res => res.json());
        });

        return Promise.all(episodePromises).then(episodes => {
            show.episodes = episodes;
            return show;
        });
    });
}

getMrRobotWithPromise().then(printDataToScreen);
```







## Generators detour

Let's take a small detour and investigate JavaScript generators

In C# this is the equivalent `IEnumerable or IEnumerable<T>`
or in Java `Iterable<B>`

```javascript

function* simpleGenerator() {
  yield 1;
  yield 2;
  yield 3;

//  for (let i = 0; i < 3; i++) {
//      yield i;
//  }
}

for(let item of simpleGenerator()) {
  console.log(item);
}


var generator = simpleGenerator();
console.log('generator', generator);
var result = generator.next();
console.log(result); // {value: 1, done: false}

result = generator.next();
console.log(result); // {value: 2, done: false}

result = generator.next();
console.log(result); // {value: 3, done: false}

result = generator.next();
console.log(result); // {value: undefined, done: true}
```

## Generator

```javascript

function* getMrRobotWithGenerator(whatToDoWhenWeHaveShow) {
  console.log('gen 1');

  let request = function request(url) {
    // notice how I don't return the Promise here
    // the myGenerator.next below is what signals
    // the generator is can move on.
    fetch(url)
        .then(req => req.json())
        .then(data => myGenerator.next(data));
  }

  var show = yield request(mrRobotShowUrl);
  console.log('gen 2');

  var episodes = [];
  for(let i = 0; i < show.episodes.length; i++) {
      console.log('gen for ', i);
      let episodeId = show.episodes[i];
      var episode = yield request(
          `${mrRobotEpisodeUrl}/${episodeId}`);
      episodes.push(episode);
  }
  console.log('gen 3');

  show.episodes = episodes;

  whatToDoWhenWeHaveShow(show);
  console.log('gen 4');
}

console.log('before gen');
var myGenerator = getMrRobotWithGenerator(printDataToScreen);
console.log('created generator');
var x = myGenerator.next();
console.log('started generator');
```







## Async/Await

async/await (syntatic sugar around Promises & Generators)

```javascript
function resolveAfter2Seconds(x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x);
    }, 2000);
  });
}

async function f1() {
  var x = await resolveAfter2Seconds(10);
  console.log(x); // 10
}
f1().then(()=> console.log('done'));
```

If a you try to await a non-promise it will return
the value wrapped as a promise

```javascript
async function f2() {
  var y = await 20;
  console.log(y); // 20
}
f2();
```

How to handle errors with async/await (use try/catch)

```javascript
async function fThrowsErr() {
    throw new Error("test error");
}
async function f3() {
    try {
        await fThrowsErr();
    } catch (err) {
        console.error(err);
    }
}
f3();
```





See how they implement it in TypeScript

```javascript
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : new P(function(resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function(thisArg, body) {
    var _ = {
            label: 0,
            sent: function() {
                if (t[0] & 1) throw t[1];
                return t[1];
            },
            trys: [],
            ops: []
        },
        f, y, t;
    return {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    };

    function verb(n) {
        return function(v) {
            return step([n, v]);
        };
    }

    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [0];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [6, e];
            y = 0;
        } finally {
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
};

function f2(b) {
    return __awaiter(this, void 0, void 0, function() {
        var y;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    console.log(b);
                    return [4 /*yield*/ , 20];
                case 1:
                    y = _a.sent();
                    console.log(y); // 20
                    return [2 /*return*/ ];
            }
        });
    });
}
var x = f2();
x.then(function() {
    console.log('complete');
});
```

TIP: show what TypeScript does with the above at the TypeScript playground


```javascript

async function getMrRobotWithAsync1() {
  let fetchJson = async url => {
      let response = await fetch(url);
      let json = await response.json();
      return json;
  };

  let show = await fetchJson(mrRobotShowUrl);

  let episodes = [];
  for(let i = 0; i < show.episodes.length; i++) {
      let episodeId = show.episodes[i];
      let episode = await fetchJson(`${mrRobotEpisodeUrl}/${episodeId}`);
      episodes.push(episode);
  }
  show.episodes = episodes;
  return show;
}

async function getMrRobotWithAsync2() {
  let fetchJson = url => fetch(url).then(res => res.json());
  var show = await fetchJson(mrRobotShowUrl);
  let episodesPromiseList = show.episodes.map(async episodeId => {
      let res = fetchJson(`${mrRobotEpisodeUrl}/${episodeId}`);
      return res;
  });
  show.episodes = await Promise.all(episodesPromiseList);
  return show;
}

getMrRobotWithAsync1().then(printDataToScreen);
//getMrRobotWithAsync2().then(printDataToScreen);
```





## Tiny exercise - make this async

```javascript


localStorage.setItem('test', 'Hello World');

class MyStorage {
    getData() {
        return localStorage.getItem('test');
    }
}

class BusinessObject {
    constructor() {
      this.storage = new MyStorage();

    }
    doSomeWork () {
        var data = this.storage.getData();
        return data;
    }
}

function main() {
    var bo = new BusinessObject();
    var data = bo.doSomeWork();
    console.log(data);
}
main();
```




## Make sure you cover

- Browser Compat
- Tooling to take advantage and use it now (Babel, TypeScript)
- try/catch



## References

`https://www.chromestatus.com/feature/5643236399906816`
`https://docs.google.com/document/d/1K38ct2dsxG_9OfmgErvFld4MPDC4Wkr8tPuqmSWu_3Y/edit`
`https://thomashunter.name/blog/the-long-road-to-asyncawait-in-javascript/`
