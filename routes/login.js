const Joi = require('joi');
const MongoClient = require('mongodb').MongoClient;

module.exports = [{
    method: 'POST',
    path: '/api/login',
    handler: (req, h) => {
        h.type = 'application/json';
        const url = getUrl(req.payload);
        console.log("connection string mongodb " + url)
        return new Promise(resolve => {
            let client = new MongoClient(url, {
                useNewUrlParser: true
            });
            client.connect(error => {
                if (error != null) {
                    console.log(error)
                    resolve(error)
                }
                else {
                    if (req.payload.Database == undefined) {
                        // Use the admin database for the operation
                        const adminDb = client.db(req.payload.Admin).admin();
                        // List all the available databases
                        adminDb.listDatabases(function (err, dbs) {
                            resolve({ client:client, collections: dbs['databases'] })
                        });
                    }
                    else {
                        const db = client.db();
                        db.listCollections().toArray().then(collections => {
                            resolve({ client:client, collections:collections });
                        })
                    }

                }

            })
        }).then(val => {
            return h.response(JSON.stringify({collections:val.collections})).code(200)
        })


    },
    options: {
        cors: true,
        validate: {
            payload: {
                Username: Joi.string().optional(),
                Password: Joi.string().optional(),
                Host: Joi.string().required(),
                Port: Joi.number().optional(),
                Database: Joi.string().optional(),
                Admin: Joi.string().optional().default('admin')
            },
        },
    },
},];



var getUrl = (payload) => {
    let url = 'mongodb://';
    if (payload.Username && payload.Password) {
        const username = payload.Username;
        const password = payload.Password;
        url = url + `${username}:${password}@`;
    }
    const host = payload.Host;
    url = url + `${host}`;
    if (payload.Port) {
        const port = payload.Port;
        url = url + `:${port}`;
    }
    if (payload.Database) {
        url = url + `/${payload.Database}`;
    }
    return url;
}