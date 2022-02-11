echo "--> Uninstalling angular-cli dependency ..."
npm uninstall -g @angular-cli

echo "--> Reinstalling angular-cli dependency ..."
npm install -g @angular/cli@latest

echo "--> Removing node_modules ..."
rm -rf node_modules # otherwise the angular-cli install from node_modules will be prioritized


echo "--> Uninstalling angular-cli dev dependency ..."
npm uninstall --save-dev @angular/cli --legacy-peer-deps

echo "--> Reinstalling angular-cli dev dependency ..."
npm install --save-dev @angular/cli@latest --legacy-peer-deps

# set HTTP_PROXY and HTTPS_PROXY to empty or the proxy address
export HTTP_PROXY=""
export HTTPS_PROXY=""

echo "--> Updating angular CLI and Core version"
ng update @angular/cli @angular/core --force

npm install --legacy-peer-deps
