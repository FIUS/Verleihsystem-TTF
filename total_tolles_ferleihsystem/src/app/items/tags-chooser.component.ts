import { Component, forwardRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { myDropdownComponent } from '../shared/dropdown/dropdown.component';
import { ApiObject } from '../shared/rest/api-base.service';
import { ApiService } from '../shared/rest/api.service';




@Component({
  selector: 'ttf-tags-chooser',
  templateUrl: 'tags-chooser.component.html',
})
export class TagsChooserComponent implements OnInit, OnDestroy {

    private itemSubscription: Subscription;
    private tagsSubscription: Subscription;

    @Input() itemID: number;
    item: ApiObject;

    searchTerm: string = '';

    tags: ApiObject[];

    selected: Set<number> = new Set<number>();
    filter: Set<number> = new Set<number>();

    highlighted: number;

    constructor(private api: ApiService) {}

    ngOnInit(): void {
        this.tagsSubscription = this.api.getTags().subscribe(data => {
            if (data == undefined) {
                return;
            }
            this.tags = data;
            this.updateFilter();
        });
        this.itemSubscription = this.api.getItem(this.itemID).subscribe(item => {
            if (item == null) {
                return;
            }
            this.item = item;
            this.api.getTagsForItem(item).subscribe(tags => {
                const selected = new Set<number>();
                tags.forEach(tag => {
                    selected.add(tag.id);
                });
                this.selected = selected;
            });
        });
    }

    ngOnDestroy(): void {
        if (this.tagsSubscription != null) {
            this.tagsSubscription.unsubscribe();
        }
        if (this.itemSubscription != null) {
            this.itemSubscription.unsubscribe();
        }
    }

    updateFilter() {
        const filter = new Set<number>();
        this.tags.forEach(tag => {
            if (!tag.name.toUpperCase().includes(this.searchTerm.toUpperCase())) {
                filter.add(tag.id);
            }
        });
        this.filter = filter;
        this.updateHighlight();
    }

    updateHighlight() {
        if (this.highlighted == null || this.filter.has(this.highlighted)) {
            for (const tag of this.tags) {
                if (!this.filter.has(tag.id)) {
                    this.highlighted = tag.id;
                    return;
                }
            }
        }
    }

    select(tag?: ApiObject) {
        if (this.item != null) {
            if (tag == null) {
                for (const tag2 of this.tags) {
                    if (tag2.id === this.highlighted) {
                        tag = tag2;
                    }
                }
            }
            if (tag == null) {
                return;
            }
            if (this.selected.has(tag.id)) {
                this.deselect(tag);
            } else {
                this.selected.add(tag.id);
                this.api.addTagToItem(this.item, tag);
            }
        }
    }

    deselect(tag: ApiObject) {
        if (this.item != null) {
            this.selected.delete(tag.id);
            this.api.removeTagFromItem(this.item, tag);
        }
    }

    highlightNext() {
        let found = false;
        for (const tag of this.tags) {
            if (!this.filter.has(tag.id)) {
                if (found) {
                    this.highlighted = tag.id;
                    return;
                }
                if (this.highlighted === tag.id) {
                    found = true;
                }
            }
        }
    }

    highlightPrevious() {
        let last;
        for (const tag of this.tags) {
            if (!this.filter.has(tag.id)) {
                if (this.highlighted === tag.id) {
                    this.highlighted = last;
                }
                last = tag.id;
            }
        }
    }
}
