# SISOSIGN

Developed by Moritz Lüdtke

SISOSIGN is a work time calculator on the web. It is intentionally designed for the german market.

Enjoy it in it's full glory [right here](https://sisosign.herokuapp.com/).

![SISOSIGN Screenshot](./readme-content/SISOSIGN-Screenshot.png "SISOSIGN Screenshot")

## Local Development
- `npm run serve` or `ng serve` runs it locally

### Update Angular Version via Angular CLI

```shell
npm uninstall -g @angular-cli
npm install -g @angular/cli@latest

rm -rf node_modules # otherwise the angular-cli install from node_modules will be prioritized
npm uninstall --save-dev @angular/cli --legacy-peer-deps
npm install --save-dev @angular/cli@latest --legacy-peer-deps

# set HTTP_PROXY and HTTPS_PROXY to empty or the proxy address
ng update @angular/cli @angular/core --force

npm install --legacy-peer-deps
```

### Tipps


## Trivia

1. If you want to know what SISOSIGN stands for you have to take a look at the source code, look carefully through the ui or ask a die hard fan ;)
2. SISOSIGN probably has more users than the developer assumes.

## Credits

- [Pure CSS Firworks from Eddie Lin (CodePen Link)](https://codepen.io/yshlin/pen/ylDEk)
