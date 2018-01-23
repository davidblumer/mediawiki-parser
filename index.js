const request = require('request'),
      fs = require('fs'),
      querystring = require('querystring')
;

// Parameters for the QueryBuilder
const
    action = 'query',
    apiEndpoint = 'allimages',
    baseUrl = 'http://metin2wiki.de',
    continueEndpoint = 'aicontinue',
    format = 'json',
    limitEndpoint = 'ailimit',
    rateLimit = '500',
    resultFile = 'images.txt'
;

// Which parts of the response should be parsed
const partsToSave = [
    'url'
];


let pageToContinue = '';

function crawl(pageToContinue = '') {
    let wikiurl = queryBuilder(pageToContinue);

    let q = new Promise((res, rej) => {
        request(wikiurl, (err, response, body) => {
            response = JSON.parse(body);
            let pages = response[action][apiEndpoint];

            if(response['query-continue']) {
                pageToContinue = getContinueParameter(response);
            } else {
                console.log('finished')
                return false;
            }

            saveToFile(pages).then(() => {
                if(pageToContinue !== '') {
                    crawl(pageToContinue);
                }
            });
        })
    })

    return q;
}

function saveToFile(result) {
    let q = new Promise((res, rej) => {
        for(var i = 0; i < result.length; i++) {
            getPartsToSave(result[i]).then((val) => {
                fs.appendFile(resultFile, val + '\r\n', (err) => {
                    if(err) throw err;
                })
            });
        }

        res(result);
    });

    return q;
}

function queryBuilder(pageToContinue) {
    return baseUrl
        + '/api.php'
        + '?action=' + action
        + '&list=' + apiEndpoint
        + '&' + limitEndpoint + '=' + rateLimit
        + '&format' + '=' + format
        + '&' + continueEndpoint + '=' + pageToContinue;
}

function clearResultFile() {
    if(fs.existsSync(resultFile))
        return fs.unlink(resultFile);
    return false
}

function getPartsToSave(result) {
    var q = new Promise((res, rej) => {
        partsToSave.map((key) => {
            if(result[key])
                res(result[key]);
        });

        rej(null)
    });

    return q;
}

function getContinueParameter(queryContinue) {
    return Object.values(queryContinue['query-continue'][Object.keys(queryContinue['query-continue'])]);
}

clearResultFile();
crawl();