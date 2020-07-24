import { Component } from '@angular/core';

const { version: appVersion } = require('../../package.json');

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [ './app.component.css' ]
})
export class AppComponent {
    appVersion;

    constructor() {
        this.appVersion = appVersion;
    }
}
