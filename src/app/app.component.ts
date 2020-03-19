import { Component } from '@angular/core';

const { version: appVersion } = require('../../package.json');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  readonly RELEASE_NOTE_URL = 'https://github.com/moritzluedtke/sisosign/releases';
  appVersion;

  constructor() {
    this.appVersion = appVersion;
  }
}
