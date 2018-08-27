import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationService, Breadcrumb } from '../navigation/navigation-service';
import { JWTService } from '../shared/rest/jwt.service';
import { ApiService } from '../shared/rest/api.service';
import { ApiObject } from '../shared/rest/api-base.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'ttf-home',
    templateUrl: './home.component.html',
    styles: [
        `.ttf-button-grid {
            display: -ms-grid;
            display: grid;
            grid-template-columns: 0px 17rem repeat(auto-fill, minmax(20px, 1fr) 17rem);
        }`,
        `@-moz-document url-prefix() {
            .spacer {
                display: none;
            }
            .ttf-button-grid {
                grid-template-columns: repeat(auto-fill, 17rem);
            }
        }`
    ]
})
export class HomeComponent implements OnInit {

    lentItems: ApiObject[];

    justifyBetween: boolean = false;

    @ViewChild('#menuContainer') menuContainer;

    constructor(private data: NavigationService, private jwt: JWTService, private api: ApiService) { }

    ngOnInit(): void {
        this.data.changeTitle('Total Tolles Ferleihsystem – Home');
        this.data.changeBreadcrumbs([]);
        this.api.getLentItems('errors').subscribe(items => {
            this.lentItems = items;
        });
        Observable.timer(5 * 60 * 1000, 5 * 60 * 1000).subscribe(() => this.api.getLentItems());
        Observable.timer(1).subscribe(() => this.updateJustify());
    }

    updateJustify() {
        console.log(this.menuContainer);
    }

    itemOverdue(item: ApiObject): boolean {
        const due = new Date(item.due);
        return due < new Date();
    }

}
