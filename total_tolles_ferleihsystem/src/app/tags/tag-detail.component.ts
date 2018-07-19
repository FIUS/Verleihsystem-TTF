import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationService, Breadcrumb } from '../navigation/navigation-service';
import { ApiService } from '../shared/rest/api.service';
import { Subscription } from 'rxjs/Rx';
import { JWTService } from '../shared/rest/jwt.service';

@Component({
  selector: 'ttf-tag-detail',
  templateUrl: './tag-detail.component.html'
})
export class TagDetailComponent implements OnInit, OnDestroy {

    private paramSubscription: Subscription;
    private tagSubscription: Subscription;

    tagID: number;
    tag;

    constructor(private data: NavigationService, private api: ApiService, private route: ActivatedRoute, private jwt: JWTService) { }

    ngOnInit(): void {
        this.data.changeTitle('Total Tolles Ferleihsystem – Tag');
        this.paramSubscription = this.route.params.subscribe(params => {
            this.update(parseInt(params['id'], 10));
        });
    }

    update(tagID: number) {
        this.tagID = tagID;
        if (this.tagSubscription != null) {
            this.tagSubscription.unsubscribe();
        }
        this.data.changeBreadcrumbs([new Breadcrumb('Tags', '/tags'),
            new Breadcrumb('"' + tagID.toString() + '"', '/tags/' + tagID)]);
        this.tagSubscription = this.api.getTag(tagID).subscribe(tag => {
            this.tag = tag;
            this.data.changeBreadcrumbs([new Breadcrumb('Tags', '/tags'),
                new Breadcrumb('"' + tag.name + '"', '/tags/' + tagID)]);
        });
    }

    ngOnDestroy(): void {
        if (this.paramSubscription != null) {
            this.paramSubscription.unsubscribe();
        }
        if (this.tagSubscription != null) {
            this.tagSubscription.unsubscribe();
        }
    }

}
