import { Injectable } from '@angular/core';

const { version: versionFromPackageJson } = require('../../../package.json');

@Injectable({
    providedIn: 'root'
})
export class AppVersionService {
    appVersion;
    private newVersionPresent = false;

    constructor() {
        this.appVersion = versionFromPackageJson;
    }

    public getAppVersion(): string {
        return this.appVersion;
    }

    public isNewVersionPresent(): boolean {
        return this.newVersionPresent;
    }

    public setNewVersionPresentTo(newValue: boolean) {
        this.newVersionPresent = newValue;
    }

}