
import {timer as observableTimer,  Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { JWTService } from '../jwt.service';


@Injectable()
export class LoginGuard implements CanActivate {

    constructor(private router: Router, private jwt: JWTService) { }

    canActivate() {
        if (this.jwt.loggedIn()) {
            // logged in so return true
            return true;
        }

        // not logged in so redirect to login page
        observableTimer(300).subscribe(() => {
            if (!this.jwt.loggedIn()) {
                this.router.navigate(['/login']);
            }
        });
        return false;
    }
}
