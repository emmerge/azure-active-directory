AzureAd = {};

// Request AzureAd credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
AzureAd.requestCredential = function (options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    } else if (!options) {
        options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({service: 'azureAd'});
    if (!config) {
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(
            new ServiceConfiguration.ConfigError());
        return;
    }

    var credentialToken = Random.secret();

    // capture any given scopes:
    var basicScope = ['wl.basic'], scope = [];
    if (options.requestPermissions)
        scope = options.requestPermissions;
    scope = _.union(scope, basicScope);
    var flatScope = _.map(scope, encodeURIComponent).join('+');

    // http://msdn.microsoft.com/en-us/library/azure/dn645542.aspx
    var loginStyle = OAuth._loginStyle('azureAd', config, options);

    //MUST be "popup" - currently Azure AD does not allow for url parameters in redirect URI's. If a null popup style is assigned, then
    //the url parameter "close" is appended and authentication will fail.
    config.loginStyle = "popup";

    var baseUrl = "https://login.windows.net/" + config.tennantId + "/oauth2/authorize?";
    var loginUrl = baseUrl +
        'api-version=1.0&' +
        '&response_type=code' +
        '&client_id=' + config.clientId +
        '&scope=' + flatScope +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken) +
        '&redirect_uri=' + OAuth._redirectUri('azureAd', config);

    OAuth.launchLogin({
        loginService: "azureAd",
        loginStyle: loginStyle,
        loginUrl: loginUrl,
        credentialRequestCompleteCallback: credentialRequestCompleteCallback,
        credentialToken: credentialToken,
        popupOptions: { height: 600 }
    });
};
