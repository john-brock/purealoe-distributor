var content = document.getElementById('content');
var bundles;

function renderBundleList() {
    var html = '';
    bundles.forEach(function(bundle) {
        html = html + '<div class="row">' + renderBundle(bundle) + '</div>';
    });
    content.innerHTML = html;
}

function renderBundle(bundle, isAnimated) {
    return `
        <div class="col-sm-12">
            <div class="panel panel-primary ${isAnimated?"animateIn":""}">
                <div class="panel-heading">Bundle ID: ${bundle.bundleName}</div>
                <div class="panel-body">
                    <div class="col-md-12 col-lg-7">
                        <table>
                            <tr>
                                <td class="panel-table-label">Description:</td><td>${bundle.bundleDescription}</td>
                            </tr>
                            <tr>
                            <td class="panel-table-label">Items:</td><td>${bundle.qty}</td>
                        </tr>
                    </table>
                    </div>   
                    <div class="col-md-12 col-lg-7">
                        <button class="btn btn-info" onclick="getBundleDetails('${bundle.bundleId}')" style="margin-bottom: 4px;">
                            <span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>
                            View Details
                        </button>
                        <button class="btn btn-info" id="orderButton" onclick="renderOrderModal('${bundle.bundleId}')" style="margin-bottom: 4px;">
                            <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                            Order Bundle
                        </button>
                    </div>
                    <div id="details-${bundle.bundleId}" class="col-md-12"></div>
                </div>
            </div>
        </div>`;
}

function renderOrderModalInner(bundleId) {
    return `
        <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Order Bundle</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <p>Submit your order today!</p>
                <form>
                 <input type="hidden" id="bundleIdInput" name="bundleId" value="">
                 <div class="form-group">
                    <div class="form-row">
                       <div class="col">
                          <input type="text" id="firstNameInput" class="form-control" placeholder="First name" value="Sally">
                       </div>
                       <div class="col">
                          <input type="text" id="lastNameInput" class="form-control" placeholder="Last name" value="Suds">
                       </div>
                    </div>
                 </div>
                 <div class="form-group">
                    <div class="form-row">
                       <div class="col">
                          <input type="phone" id="phoneNumberInput" class="form-control" placeholder="Phone Number" value="+15754304788">
                       </div>
                       <div class="col">
                          <div class="form-check form-check-inline">
                             <input class="form-check-input" type="radio" name="textOptions" id="smsUpdatesYes" value=true checked>
                             <label class="form-check-label" for="smsUpdatesYes">Text Updates</label>
                          </div>
                          <div class="form-check form-check-inline">
                             <input class="form-check-input" type="radio" name="textOptions" id="smsUpdatesNo" value=false>
                             <label class="form-check-label" for="smsUpdatesNo">No Updates</label>
                          </div>
                       </div>
                    </div>
                 </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="orderBundle('${bundleId}')">Order</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
    `;
}

// Render the merchandise list for a bundle
function renderBundleDetails(bundle, items) {
    var html = `
        <table class="table">
            <tr>
                <th colspan="2">Product</th>
                <th>MSRP</th>
                <th>Qty</th>
            </tr>`;
    items.forEach(function(item) {
        html = html + `
            <tr>
                <td><img src="${item.pictureURL}" style="height:50px"/></td>
                <td>${item.productTitle}</td>
                <td>$${item.price}</td>
                <td>${item.qty}</td>
            </tr>`
    });
    html = html + "</table>"    
    var details = document.getElementById('details-' + bundle.bundleId);
    details.innerHTML = html;
}

function renderOrderModal(bundleId) {
    var orderModal = $('#orderModal');
    orderModal.html(renderOrderModalInner(bundleId));
    orderModal.modal('show');
    $('#bundleIdInput').val(bundleId);
}

function deleteBundle(bundleId) {
    for (var i = 0; i < bundles.length; i++) {
        if (bundles[i].bundleId === bundleId) {
            bundles.splice(i, 1);
            break;
        }
    }
}

var socket = io.connect();

socket.on('bundle_submitted', function (newBundle) {
    // if the bundle is alresdy in the list: do nothing
    var exists = false;
    bundles.forEach((bundle) => {
        if (bundle.bundleId == newBundle.bundleId) {
            exists = true;
        }
    });
    // if the bundle is not in the list: add it
    if (!exists) {
        bundles.push(newBundle);
        var el = document.createElement("div");
        el.className = "row";
        el.innerHTML = renderBundle(newBundle, true);
        content.insertBefore(el, content.firstChild);
    }
});

socket.on('bundle_unsubmitted', function (data) {
    deleteBundle(data.bundleId);
    renderBundleList();
});

// Retrieve the existing list of bundles from Node server
function getBundleList() {
    var xhr = new XMLHttpRequest(),
        method = 'GET',
        url = '/bundles';

    xhr.open(method, url, true);
    xhr.onload = function () {
        console.log(xhr.responseText);
        bundles = JSON.parse(xhr.responseText);
        renderBundleList();
    };
    xhr.send();
}

// Retrieve the product list for a bundle from Node server
function getBundleDetails(bundleId) {
    var details = document.getElementById('details-' + bundleId);
    if (details.innerHTML != '') {
        details.innerHTML = '';
        return;
    }
    var bundle;
    for (var i=0; i<bundles.length; i++) {
        if (bundles[i].bundleId === bundleId) {
            bundle = bundles[i];
            break;
        }
    };

    var xhr = new XMLHttpRequest(),
        method = 'GET',
        url = '/bundles/' + bundleId;

    xhr.open(method, url, true);
    xhr.onload = function () {
        var items = JSON.parse(xhr.responseText);
        renderBundleDetails(bundle, items);
    };
    xhr.send();
}

// Post approve message to Node server
function orderBundle() {
    var bundleId = $('#bundleIdInput').val();
    var firstName = $('#firstNameInput').val();
    var lastName = $('#lastNameInput').val();
    var phoneNumber = $('#phoneNumberInput').val();
    var textUpdates = $('input[name=textOptions]:checked').val();

    console.log(bundleId);
    console.log(firstName);
    console.log(lastName);
    console.log(phoneNumber);
    console.log(textUpdates);
    
    var requestBody = buildCompositeRestRequest(bundleId, firstName, lastName, phoneNumber, textUpdates);
    console.log(requestBody);
    var xhr = new XMLHttpRequest(),
        method = 'POST',
        url = '/approvals/' + bundleId;

    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        //deleteBundle(bundleId);
        renderBundleList();
        var orderButton = $('#orderButton');
        orderButton.text('Ordered!');
        orderButton.prop('disabled', true);
        $('#orderModal').modal('hide');
    };
    xhr.send(requestBody);
}

function buildCompositeRestRequest(bundleId, firstName, lastName, phoneNumber, textUpdates) {
    var fullName = firstName + ' ' + lastName;
    var smsOptOut = !textUpdates;
    var now = new Date().toISOString();

    return `
        {
            "compositeRequest": [
                {
                    "method": "POST",
                    "url": "/services/data/v47.0/sobjects/Account",
                    "referenceId": "newAccount",
                    "body": {
                        "Name": "${fullName}",
                        "Type": "Customer - Direct",
                        "Website": "https://pure-aloe.com",
                        "Description": "Created during Integration demo",
                        "AccountSource": "Dreamforce Integration Demo Pod Booth"
                    }
                },
                {
                    "method": "POST",
                    "url": "/services/data/v47.0/sobjects/Contact",
                    "referenceId": "newContact",
                    "body": {
                        "AccountId": "@{newAccount.id}",
                        "FirstName": "${firstName}",
                        "LastName": "${lastName}",
                        "Phone": "${phoneNumber}",
                        "Department": "Purchasing",
                        "Description": "Created during Integration demo",
                        "SMS_Opt_Out__c": "${smsOptOut}"
                    }
                },
                {
                    "method": "PATCH",
                    "url": "/services/data/v47.0/sobjects/Bundle__c/${bundleId}",
                    "referenceId": "updatedBundle",
                    "body": {
                        "Account__c": "@{newAccount.id}",
                        "Date_Ordered__c": "${now}",
                        "Status__c": "Ordered By Customer"
                    }
                }
            ]
        }
    `;
}

getBundleList();