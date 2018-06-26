import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { QuestionService } from '../shared/forms/question.service';
import { QuestionControlService } from '../shared/forms/question-control.service';
import { QuestionBase } from '../shared/forms/question-base';
import { ApiObject } from '../shared/rest/api-base.service';
import { ApiService } from '../shared/rest/api.service';
import { TypeQuestion } from '../shared/forms/question-type';
import { NumberQuestion } from '../shared/forms/question-number';
import { StagingService } from '../navigation/staging-service';
import { Subject, Observable, AsyncSubject } from 'rxjs/Rx';

@Component({
    selector: 'ttf-search',
    templateUrl: './search.component.html'
})
export class SearchComponent  {

    typeQuestion: NumberQuestion = new NumberQuestion();

    open: boolean = false;

    searchstring: string = '';
    includeDeleted: boolean = false;
    includeLent: boolean = true;
    type: number;
    tags: Set<number>;
    attributes: ApiObject[];
    attributeQuestions: Map<number, QuestionBase<any>[]> = new Map<number, QuestionBase<any>[]>();
    attributeForms: Map<number, FormGroup> = new Map<number, FormGroup>();

    searchDone: boolean = false;

    alphabet: Array<string> = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
                               'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
                               'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    data: Map<string, any>;
    availableLetters: Set<string>;
    itemTags: Map<number, ApiObject[]> = new Map<number, ApiObject[]>();
    itemAttributes: Map<number, ApiObject[]> = new Map<number, ApiObject[]>();
    nrOfItemsFound: number = 0;

    filter: string;

    @Input() asSelector: boolean = false;
    @Input() restrictToType: number = -1;
    @Output() selectedChanged: EventEmitter<ApiObject> = new EventEmitter<ApiObject>();

    constructor(private api: ApiService, private staging: StagingService,
                private qs: QuestionService, private qcs: QuestionControlService) { }

    resetSearchData() {
        console.log('RESET');
        this.searchDone = false;
        this.data = new Map<string, ApiObject[]>();
    }

    search = () => {
        this.searchDone = false;
        if (this.restrictToType != null && this.restrictToType >= 0) {
            this.type = this.restrictToType;
        }
        const attributes = new Map<number, string>();
        if (this.attributes != null) {
            this.attributes.forEach(attr => {
                if (this.attributeForms.get(attr.id).valid &&
                    this.attributeForms.get(attr.id).value[attr.name] != null &&
                    !(attr.type === 'string' && this.attributeForms.get(attr.id).value[attr.name].length === 0)) {
                    attributes.set(attr.id, JSON.stringify(this.attributeForms.get(attr.id).value[attr.name]))
                }
            });
        }
        this.api.search(this.searchstring, this.type, this.tags, attributes, this.includeDeleted, this.includeLent).subscribe(data => {
            const map = new Map<string, ApiObject[]>();
            const availableLetters = new Set<string>();
            this.alphabet.forEach(letter => map.set(letter, []));
            this.nrOfItemsFound = data.length;
            data.forEach(item => {
                this.api.getTagsForItem(item).take(1).subscribe(tags => {
                    this.itemTags.set(item.id, tags);
                });
                this.api.getAttributes(item).take(1).subscribe(attributes => {
                    this.itemAttributes.set(item.id, attributes);
                });
                let letter: string = item.name.toUpperCase().substr(0, 1);
                if (letter === 'Ä') {
                    letter = 'A';
                }
                if (letter === 'Ö') {
                    letter = 'O';
                }
                if (letter === 'Ü') {
                    letter = 'U';
                }
                if (letter === 'ẞ') {
                    letter = 'S';
                }
                if (letter.match(/^[A-Z]/) == null) {
                    letter = '#';
                }
                availableLetters.add(letter);
                const list = map.get(letter);
                if (list != null) {
                    list.push(item);
                }
            });
            this.data = map;
            this.availableLetters = availableLetters;
            this.searchDone = true;
        });
    }

    setFilter(value) {
        if (value == null || (this.data != null && this.data.get(value) != null && this.data.get(value).length > 0)) {
            this.filter = value;
        }
    }

    updateAttributes() {
        const typeAndTagsSubject = new Subject<ApiObject>();

        typeAndTagsSubject.flatMap(typeOrTag => {
            return this.api.getLinkedAttributeDefinitions(typeOrTag).take(1)
        }).map(attributes => Observable.from(attributes))
        .concatAll()
        .distinct(attr => attr.id)
        .toArray()
        .map(attrs => attrs.sort((a, b) => a.type.localeCompare(b.type)).sort((a, b) => a.name.localeCompare(b.name)))
        .subscribe(attributes => {
            this.attributes = attributes;
            attributes.forEach(this.getQuestion);
        });

        const finished = [];
        if (this.type >= 0) {
            const obs = this.api.getItemType(this.type).take(1);
            obs.subscribe(itemType => {
                typeAndTagsSubject.next(itemType);
            });
            finished.push(obs);
        }
        if (this.tags != null ) {
            this.tags.forEach(tagID => {
                const obs = this.api.getTag(tagID).take(1);
                obs.subscribe(itemTag => {
                    typeAndTagsSubject.next(itemTag);
                });
                finished.push(obs);
            });
        }
        Observable.forkJoin(finished).subscribe(() => typeAndTagsSubject.complete());
    }

    getQuestion = (attribute_definition) => {
        let schema: any = {};
        if (attribute_definition.jsonschema != null && attribute_definition.jsonschema !== '') {
            schema = JSON.parse(attribute_definition.jsonschema);
        }
        schema.type = attribute_definition.type;
        schema['x-nullable'] = true;
        if (attribute_definition.type === 'string') {
            const maxLength = (window as any).maxDBStringLength - 2;
            if (schema.maxLength == null || schema.maxLength > maxLength) {
                schema.maxLength = maxLength;
            }
        }
        this.qs.getQuestionsFromScheme({
            type: 'object',
            properties: {
                [attribute_definition.name]: schema,
            }
        }).take(1).subscribe(questions => {
            questions.forEach(qstn => {
                if (qstn.key === attribute_definition.name) {
                    qstn.autocompleteData = this.api.getAttributeAutocomplete(attribute_definition);
                }
            });
            this.attributeQuestions.set(attribute_definition.id, questions);
            const form = this.qcs.toFormGroup(questions)
            this.attributeForms.set(attribute_definition.id, form);
            let value = undefined; // TODO
            try {
                value = JSON.parse(value);
            } catch (SyntaxError) {}
            form.patchValue({
                [attribute_definition.name]: value,
            });
        });
    }

    select(item: ApiObject) {
        this.selectedChanged.emit(item);
    }

    stageAll(letter?: string) {
        if (letter == null) {
            this.data.forEach(items => {
                items.forEach(item => {
                    if (item.type.lendable && item.is_currently_lent) {
                        this.staging.stage(item.id);
                    }
                });
            });
        } else {
            const items = this.data.get(letter);
            if (items != null) {
                items.forEach(item => {
                    if (item.type.lendable && item.is_currently_lent) {
                        this.staging.stage(item.id);
                    }
                });
            }
        }
    }
}
