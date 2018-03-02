import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { JWTService } from '../jwt.service';


@Injectable()
export class AdminGuard implements CanActivate {

    constructor(private router: Router, private jwt: JWTService) { }

    canActivate() {
        return this.jwt.isAdmin();
    }
}
