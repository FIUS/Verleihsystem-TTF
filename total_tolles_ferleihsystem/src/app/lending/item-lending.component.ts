import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { ApiService } from '../shared/rest/api.service';
import { ApiObject } from '../shared/rest/api-base.service';

@Component({
  selector: 'ttf-item-lending',
  templateUrl: './item-lending.component.html'
})
export class ItemLendingComponent implements OnInit, OnDestroy {


    @Input() itemLending: any;
    @Output() return: EventEmitter<number> = new EventEmitter<number>();

    tags: ApiObject[] = [];
    attributes: ApiObject[] = [];

    open: boolean = false;


    constructor(private api: ApiService) { }

    ngOnInit(): void {
      if (this.itemLending != null && this.itemLending.item != null) {
            this.api.getTagsForItem(this.itemLending.item).take(1).subscribe(tags => {
              this.tags = tags;
            });
            this.api.getAttributes(this.itemLending.item).take(1).subscribe(attributes => {
              this.attributes = attributes;
            });
        }
    }

    ngOnDestroy(): void {
    }
}
