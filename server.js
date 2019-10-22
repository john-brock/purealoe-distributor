let nforce = require('nforce');
let faye = require('faye');
let express = require('express');
let cors = require('cors');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server,  { wsEngine: 'ws' });
let dotenv = require('dotenv').config();
let SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

// The account id of the distributor
let accountId;

let getBundles = (req, res) => {
    let q = "SELECT Id, Name, Description__c, Qty__c FROM Bundle__c WHERE Status__c='Submitted to Distributors'";
    org.query({ query: q }, (err, resp) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        } else {
            let bundles = resp.records;
            let prettyBundles = [];
            bundles.forEach(bundle => {
                prettyBundles.push({
                    bundleId: bundle.get("Id"),
                    bundleName: bundle.get("Name"),
                    bundleDescription: bundle.get("Description__c"),
                    qty: bundle.get("Qty__c")
                });
            });
            res.json(prettyBundles);
        }
    });

};

let getBundleDetails = (req, res) => {
    let bundleId = req.params.bundleId;
    let q = "SELECT Id, Merchandise__r.Name, Merchandise__r.Title__c, Merchandise__r.Price__c, Merchandise__r.Category__c, Merchandise__r.Picture_URL__c, Qty__c " +
        "FROM Bundle_Item__c " +
        "WHERE Bundle__c = '" + bundleId + "'";
    org.query({ query: q }, (err, resp) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        } else {
            let bundleItems = resp.records;
            let prettyBundleItems = [];
            bundleItems.forEach(bundleItem => {
                prettyBundleItems.push({
                    productName: bundleItem.get("Merchandise__r").Name,
                    productTitle: bundleItem.get("Merchandise__r").Title__c,
                    price: bundleItem.get("Merchandise__r").Price__c,
                    pictureURL: bundleItem.get("Merchandise__r").Picture_URL__c,
                    bundleId: bundleItem.get("Id"),
                    productId: bundleItem.get("Merchandise__r"),
                    qty: bundleItem.get("Qty__c")
                });
            });
            res.json(prettyBundleItems);
        }
    });
};

// Subscribe to Platform Events
let subscribeToPlatformEvents = () => {
    var client = new faye.Client(org.oauth.instance_url + '/cometd/47.0/');
    client.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
    client.subscribe('/event/Bundle_Submitted__e', function (message) {
        console.log('#### got Bundle_Submitted__e event');
        // Send message to all connected Socket.io clients
        io.of('/').emit('bundle_submitted', {
            bundleId: message.payload.Bundle_Id__c,
            bundleName: message.payload.Bundle_Name__c,
            bundleDescription: message.payload.Description__c,
            qty: message.payload.Qty__c
        });
    });
    client.subscribe('/event/Bundle_Unsubmitted__e', function (message) {
        console.log('### got Bundle_Unsubmitted__e event');
        // Send message to all connected Socket.io clients
        io.of('/').emit('bundle_unsubmitted', {
            bundleId: message.payload.Bundle_Id__c,
        });
    });
    client.on('transport:down', function () {
        console.error('# Faye client dowwn');
    });
};

let orderBundle = (req, res) => {
    let bundleId = req.params.bundleId;
    let event = nforce.createSObject('Bundle_Ordered__e');
    event.set('Bundle_Id__c', bundleId);
    if (accountId) {
        event.set('Account_Id__c', accountId);
    }
    org.insert({ sobject: event }, err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            console.log('platform event published ' + bundleId + ' ' + new Date());
            res.sendStatus(200);
        }
    });
}

app.use(cors());
app.use('/', express.static(__dirname + '/www'));
app.use('/swagger', express.static(__dirname + '/swagger'));
app.get('/bundles', getBundles);
app.get('/bundles/:bundleId', getBundleDetails);
app.post('/approvals/:bundleId', orderBundle);

/*
let bayeux = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
bayeux.attach(server);
bayeux.on('disconnect', function (clientId) {
    console.log('Bayeux server disconnect');
});
*/

let PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Express server listening on ${PORT}`));

// Connect to Salesforce
let SF_CLIENT_ID = process.env.SF_CLIENT_ID;
let SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
let SF_USER_NAME = process.env.SF_USER_NAME;
let SF_USER_PASSWORD = process.env.SF_USER_PASSWORD;
let SF_ENVIRONMENT = process.env.SF_ENVIRONMENT || 'sandbox'; // default to sandbox if env variable not set
let SF_CALLBACK_URL = process.env.SF_CALLBACK_URL || 'http://localhost:5000/oauth/_callback';
console.log(SF_CLIENT_ID);
console.log(SF_CLIENT_SECRET);
console.log(SF_USER_NAME);
console.log(SF_USER_PASSWORD);
console.log(SF_ENVIRONMENT);
console.log(SF_CALLBACK_URL);

let org = nforce.createConnection({
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    environment: SF_ENVIRONMENT,
    redirectUri: SF_CALLBACK_URL,
    mode: 'single',
    autoRefresh: true
});

org.authenticate({ username: SF_USER_NAME, password: SF_USER_PASSWORD }, err => {
    if (err) {
        console.error("Salesforce authentication error");
        console.error(err);
    } else {
        console.log("Salesforce authentication successful");
        try {
            subscribeToPlatformEvents();
        } catch (e) {
            console.error(e)
        }
        // For this demo, we use the id of the first account as the distributor id.
        // Make sure there us at least one account in your Salesforce org.
        let q = "SELECT Id FROM Account LIMIT 1";
        org.query({ query: q }, (err, resp) => {
            if (err) {
                console.log(err);
            } else {
                if (resp.records && resp.records.length === 1) {
                    accountId = resp.records[0].get('Id');
                    console.log(`Account Id: ${accountId}`);
                } else {
                    console.log('WARNING: You need to create an account in your org');
                }
            }
        });
    }
});