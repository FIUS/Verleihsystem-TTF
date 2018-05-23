import { Component, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { ApiService } from '../shared/rest/api.service';
import { ApiObject } from '../shared/rest/api-base.service';

@Component({
  selector: 'ttf-file-detail',
  templateUrl: './file-detail.component.html'
})
export class FileDetailComponent implements OnChanges, OnDestroy {

    private fileSubscription: Subscription;

    @Input() fileID: number;

    @Input() uploadFileName: string;

    file: ApiObject;

    open: boolean = false;


    constructor(private api: ApiService) { }

    ngOnChanges(): void {
        if (this.fileSubscription != null) {
            this.fileSubscription.unsubscribe();
        }
        this.fileSubscription = this.api.getFile(this.fileID).subscribe(file => {
            console.log(file);
            console.log(this);
            this.file = file;
        });
    }

    ngOnDestroy(): void {
        if (this.fileSubscription != null) {
            this.fileSubscription.unsubscribe();
        }
    }

}
