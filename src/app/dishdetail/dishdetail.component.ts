import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Comment } from '../shared/comment';

@Component({
    selector: 'app-dishdetail',
    templateUrl: './dishdetail.component.html',
    styleUrls: ['./dishdetail.component.scss']
})
export class DishdetailComponent implements OnInit {
    dish: Dish;
    dishIds: string[];
    next: string;
    prev: string;

    commentForm: FormGroup;
    currentComment = {
        name: '',
        rating: 5,
        comment: ''
    };

    @ViewChild('fform') commentFormDirective;

    formErrors = {
        name: '',
        rating: '',
        comment: ''
    };

    validationMessages = {
        name: {
            required: 'Name is required',
            minlength: 'Name must be at least 2 characters long',
            maxlength: 'Name cannot be more that 25 characters long'
        },
        rating: {
            required: 'Rating is required',
            min: 'Rating value cannot be less than 1',
            max: 'Rating value cannot be more than 5'
        },
        comment: {
            required: 'Email is required'
        }
    };

    constructor(private readonly dishService: DishService,
                private readonly route: ActivatedRoute,
                private readonly location: Location,
                private readonly formBuilder: FormBuilder,
                @Inject('BaseURL') private BaseURL) { }

    ngOnInit(): void {
        this.dishService.getDishIds()
            .subscribe(dishIds => this.dishIds = dishIds);

        this.route.params
            .pipe(switchMap((params: Params) => this.dishService.getDish(params.id)))
            .subscribe(dish => {
                this.dish = dish;
                this.createForm();
                this.setPrevNext(dish.id);
            });
    }

    createForm() {
        this.commentForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
            rating: [5, [Validators.min(1), Validators.max(5)]],
            comment: ['', Validators.required]
        });

        this.commentForm.valueChanges.subscribe(data => this.onValueChanged(data));

        this.onValueChanged();
    }

    onValueChanged(data?: any) {
        if (!this.commentForm) { return; }

        const form = this.commentForm;

        for (const field in this.formErrors) {
            if (this.formErrors.hasOwnProperty(field)) {
                this.formErrors[field] = ''; 
                const control = form.get(field);
                if (control && control.dirty && !control.valid) {
                    const messages = this.validationMessages[field];
                    for (const key in control.errors) {
                        if (control.errors.hasOwnProperty(key)) {
                            console.log(key + ' ' + messages[key]);
                            this.formErrors[field] += messages[key] + ' ';
                        }
                    }
                }

                if (control && control.valid) {
                    this.currentComment[field] = control.value;
                }
            }
        }
    }

    onSubmit() {
        const comment: Comment = new Comment();
        comment.author = this.commentForm.value.name;
        comment.comment = this.commentForm.value.comment;
        comment.rating = this.commentForm.value.rating;
        comment.date = (new Date()).toISOString();
        this.dish.comments.push(comment);

        this.currentComment = { name: '', rating: 5, comment: ''};


        this.commentForm.reset(this.currentComment);
        this.commentFormDirective.resetForm();
    }

    setPrevNext(dishId: string) {
        const index = this.dishIds.indexOf(dishId);
        this.prev = this.dishIds[(index - 1) % this.dishIds.length];
        this.next = this.dishIds[(index + 1) % this.dishIds.length];
    }

    goBack() {
        this.location.back();
    }
}