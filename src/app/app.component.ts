import { Component } from '@angular/core';
import { AppVersionService } from './service/app-version.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [ './app.component.css' ]
})
export class AppComponent {

    constructor(public appVersionService: AppVersionService) {
    }

}
