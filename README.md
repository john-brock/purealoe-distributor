## Pure Aloe Distributor App - DF19 Demo

The Pure Aloe Distributor App is written in Node.js and built to run on Heroku. It is a companion to the <a href="https://github.com/trailheadapps/purealoe" target="_blank">Pure Aloe</a> app, built on Salesforce. Using the two apps, you can explore how to integrate decoupled applications with Salesforce via Platform Events.

## Installation Instructions

In the commands below, terms wrapped in \*asterisks\* signify places where you'll need to replace the dummy text we're providing with values that match your Salesforce DX or Salesforce org setup.

1. Install the Pure Aloe Salesforce application first. See instructions here: <a href="https://github.com/trailheadapps/purealoe" target="_blank">https://github.com/trailheadapps/purealoe</a>

1. In Setup > Users, create an integration user that you will use to connect to Salesforce from the Node.js app. Select **Salesforce** as the license type and **System Administrator** as the profile. 

1. Log in (at least once) as that user via your browser. For scratch orgs, use <a href="https://test.salesforce.com" target="_blank">https://test.salesforce.com</a> as the login URL. For Develper Edition orgs, use <a href="https://login.salesforce.com" target="_blank">https://login.salesforce.com</a>. Choose to not register your phone number.

1. In Setup > Users > Permission Sets, assign your integration user to the purealoe permission set.

1. Create a Connected App in a Developer Edition org (do not use your scratch org).

1. Clone this repository:
    ```
    git clone https://github.com/trailheadapps/purealoe-distributor
    cd purealoe-distributor
    ```

1. Create a Heroku app and give it a name:
    ```
    heroku create *your_app_name*
    ```

1. Set the Heroku config variables (replace with values from your connected app):
    
    ```bash
    heroku config:set SF_CLIENT_ID=*your_connected_client_id*
    heroku config:set SF_CLIENT_SECRET=*your_connected_client_secret*
    heroku config:set SF_USER_NAME=*your_integration_user_name*
    heroku config:set SF_USER_PASSWORD=*your_integration_user_password*
    heroku config:set SF_ENVIRONMENT=*your_env_type*
    heroku config:set SF_CALLBACK_URL=*your_callback_url*
    ```

    Set **SF_ENVIRONMENT** to **sandbox** if using a scratch org, or **production** if using a Developer Edition.

1. Push the code to your Heroku app: 
    ```
    git push heroku master
    ```

    or run the application locally:
    ```
    heroku run:local npm start
    ```

**Note:** If you're using a scratch org for this integration, keep in mind that you'll need to repeat the above steps and re-set your Heroku app's config variables when your scratch org expires.